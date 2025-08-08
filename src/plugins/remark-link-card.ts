import { createHash } from "node:crypto";
import * as fs from "node:fs/promises";
import path from "node:path";
import deepmerge from "@fastify/deepmerge";
import { h } from "hastscript";
import type { Link, Paragraph, Root, Text } from "mdast";
import ogs from "open-graph-scraper";
import type { ErrorResult, OgObject } from "open-graph-scraper/types";
import punycode from "punycode/";
import type { Plugin, Transformer } from "unified";
import { visit } from "unist-util-visit";

type DeepPartial<T> = T extends object
	? { [P in keyof T]?: DeepPartial<T[P]> }
	: T;

interface LinkAttributes {
	target: string;
	rel: string;
}
interface RewriteStep {
	key: string;
	pattern: RegExp;
	replacement: string;
}
interface RewriteRule {
	url: RegExp;
	rewriteSteps: RewriteStep[];
}
interface InternalLink {
	enabled: boolean;
	site: string;
}
interface Cache {
	enabled: boolean;
	outDir: string;
	cacheDir: string;
	maxFileSize: number;
	maxCacheSize: number;
	userAgent: string;
}

interface Options {
	devMode: boolean;
	excludedUrls: (string | RegExp)[];
	linkAttributes: LinkAttributes;
	rewriteRules: RewriteRule[];
	base: string;
	defaultThumbnail: string;
	internalLink: InternalLink;
	cache: Cache;
}

export type UserOptions = DeepPartial<Options>;

interface BareLink {
	url: URL;
	isInternal: boolean;
}

export interface Data {
	url: string;
	domainName: string;
	title: string;
	description: string;
	date: string;
	faviconSrc: string;
	thumbnailSrc: string;
	thumbnailAlt: string;
	hasThumbnail: boolean;
	isInternalLink: boolean;
	isError: boolean;
}

const defaultOptions: Options = {
	devMode: import.meta.env.DEV,
	excludedUrls: [],
	linkAttributes: { target: "", rel: "" },
	rewriteRules: [],
	base: "/",
	defaultThumbnail: "",
	internalLink: { enabled: false, site: "" },
	cache: {
		enabled: false,
		outDir: "./dist/",
		cacheDir: "./link-card/",
		maxFileSize: 0,
		maxCacheSize: 0,
		userAgent:
			"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
	},
};

const mimeExtensions: Record<string, string> = {
	"image/apng": ".apng",
	"image/avif": ".avif",
	"image/gif": ".gif",
	"image/jpeg": ".jpg",
	"image/png": ".png",
	"image/svg+xml": ".svg",
	"image/webp": ".webp",
	"image/bmp": ".bmp",
	"image/x-icon": ".ico",
	"image/tiff": ".tif",
};

interface ManualMeta {
	title?: string;
	description?: string;
	thumbnail?: string;
}
function parseManualMeta(line: string): ManualMeta {
	const parts = line.split("|").map((s) => s.trim());
	return {
		title: parts[0],
		description: parts[1],
		thumbnail: parts[2],
	};
}

// Matches pure-text manual syntax: URL "Title|Desc"
const urlLinePattern = /^(https?:\/\/\S+)\s+["“](.*?)["”]$/;

const remarkLinkCard: Plugin<[], Root> = (userOptions?: UserOptions) => {
	const options = deepmerge()(defaultOptions, userOptions ?? {}) as Options;

	const transformer: Transformer<Root> = async (tree) => {
		const tasks: Array<() => Promise<void>> = [];

		visit(tree, "paragraph", (node: Paragraph, index, parent) => {
			if (!parent || index == null) return;

			// Remove pure-whitespace text nodes
			const significant = node.children.filter(
				(c) => c.type !== "text" || (c.value as string).trim() !== "",
			);

			// 1) Pure-text + quotes: URL "Title|Desc"
			if (significant.length === 1 && significant[0].type === "text") {
				const raw = (significant[0] as Text).value.trim();
				const m = raw.match(urlLinePattern);
				if (m) {
					const [, urlStr, manualStr] = m;
					const { title, description, thumbnail } = parseManualMeta(manualStr);
					let urlObj: URL;
					try {
						urlObj = new URL(urlStr);
					} catch {
						return;
					}
					const bare: BareLink = { url: urlObj, isInternal: false };

					tasks.push(async () => {
						let data = (await getData(bare, options)) || {
							url: urlStr,
							domainName: urlObj.hostname,
							title: urlStr,
							description: "",
							date: "",
							faviconSrc: await getFaviconUrl(urlObj.hostname, options),
							thumbnailSrc: "",
							thumbnailAlt: "thumbnail",
							hasThumbnail: false,
							isInternalLink: false,
							isError: true,
						};
						if (title) data.title = title;
						if (description) data.description = description;
						if (thumbnail) {
							data.thumbnailSrc = thumbnail;
							data.hasThumbnail = true;
						}
						data.isError = false;
						parent.children.splice(index, 1, generateNode(data, options));
					});
					return;
				}
			}

			// 2) Bracketed manual: [Title|Desc|pic](URL) or plain autolink
			if (significant.length === 1 && significant[0].type === "link") {
				const linkNode = significant[0] as Link;
				const urlStr = linkNode.url;
				let urlObj: URL;
				try {
					urlObj = new URL(urlStr);
				} catch {
					return;
				}
				const bare: BareLink = { url: urlObj, isInternal: false };

				// Parse manual from link text if it contains '|'
				const textChild = linkNode.children[0] as Text;
				const manual = textChild.value.includes("|")
					? parseManualMeta(textChild.value)
					: {};

				tasks.push(async () => {
					let data = await getData(bare, options);
					if (!data) return;
					if (manual.title) data.title = manual.title;
					if (manual.description) data.description = manual.description;
					if (manual.thumbnail) {
						const thumb = manual.thumbnail.startsWith("/")
							? manual.thumbnail
							: `${options.base}${manual.thumbnail}`;
						data.thumbnailSrc = thumb;
						data.hasThumbnail = true;
					}
					data.isError = false;
					parent.children.splice(index, 1, generateNode(data, options));
				});
				return;
			}

			// Otherwise leave as-is
		});

		await Promise.all(tasks.map((t) => t()));
	};

	return transformer;
};

// Helpers (copy your existing implementations, ensuring no new URL(x, y))
function isExcludedUrl(url: string, opts: Options): boolean {
	return opts.excludedUrls.some((ex) =>
		typeof ex === "string" ? url.includes(ex) : ex.test(url),
	);
}

function getBareLink(node: Link, opts: Options): BareLink | null {
	if (
		node.children.length !== 1 ||
		node.children[0].type !== "text" ||
		node.children[0].value !== node.url
	) {
		return null;
	}
	try {
		const urlObj = new URL(node.url);
		return { url: urlObj, isInternal: false };
	} catch {
		return null;
	}
}

async function fetchMetadata(
	url: string,
	opts: Options,
): Promise<OgObject | null> {
	try {
		const ret = await ogs({
			url,
			fetchOptions: { headers: { "user-agent": opts.cache.userAgent } },
			timeout: 10000,
		});
		return ret.error ? null : ret.result;
	} catch {
		return null;
	}
}

async function getFaviconUrl(domain: string, opts: Options): Promise<string> {
	const fav = `https://www.google.com/s2/favicons?domain=${domain}`;
	return getImageUrl(fav, opts);
}

async function getImageUrl(src: string, opts: Options): Promise<string> {
	if (!opts.cache.enabled) return src;
	const cachePath = path.join(opts.cache.outDir, opts.cache.cacheDir);
	try {
		await fs.mkdir(cachePath, { recursive: true });
		const hash = createHash("sha256").update(decodeURI(src)).digest("hex");
		const existing = (await fs.readdir(cachePath)).find((f) =>
			f.startsWith(hash),
		);
		if (existing) return path.posix.join(opts.cache.cacheDir, existing);

		const res = await fetch(src, {
			headers: { "User-Agent": opts.cache.userAgent },
			signal: AbortSignal.timeout(10000),
		});
		const ct = res.headers.get("Content-Type") || "";
		const ext = mimeExtensions[ct] || "";
		if (!ext) return src;

		const buf = new Uint8Array(await res.arrayBuffer());
		const name = hash + ext;
		await fs.writeFile(path.join(cachePath, name), buf);
		return path.posix.join(opts.cache.cacheDir, name);
	} catch {
		return src;
	}
}

async function getData(bare: BareLink, opts: Options): Promise<Data | null> {
	let meta = await fetchMetadata(bare.url.href, opts);
	let isError = false;
	if (!meta) {
		isError = true;
		meta = {
			ogTitle: bare.url.href,
			ogDescription: "",
			ogDate: "",
			ogImage: [],
		};
	}
	const data: Data = {
		url: bare.url.href,
		domainName: bare.url.hostname,
		title: meta.ogTitle || "",
		description: meta.ogDescription || "",
		date: "",
		faviconSrc: "",
		thumbnailSrc: "",
		thumbnailAlt: "thumbnail",
		hasThumbnail: false,
		isInternalLink: bare.isInternal,
		isError,
	};
	if (meta.ogDate) {
		const d = new Date(meta.ogDate);
		if (!isNaN(d.getTime())) data.date = d.toISOString();
	}
	data.faviconSrc = await getFaviconUrl(bare.url.hostname, opts);
	if (meta.ogImage?.[0]?.url) {
		data.thumbnailSrc = await getImageUrl(meta.ogImage[0].url, opts);
		data.hasThumbnail = true;
		if (meta.ogImage[0].alt) data.thumbnailAlt = meta.ogImage[0].alt;
	} else if (opts.defaultThumbnail) {
		data.thumbnailSrc = opts.defaultThumbnail;
	}
	return data;
}

function generateNode(data: Data, opts: Options): Text {
	const aProps: any = {
		class: "link-card",
		style: "cursor:pointer",
		onclick: `
(async () => {
  try {
    await navigator.clipboard.writeText(${JSON.stringify(data.url)});
    const t = document.createElement('div');
    t.textContent = 'Copied';
    Object.assign(t.style, {
      position: 'fixed', top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)',
      padding: '0.5rem 1rem', background: 'rgba(0,0,0,0.7)',
      color: '#fff', borderRadius: '4px', zIndex: '9999', textAlign: 'center'
    });
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 5000);
  } catch {}
  window.open(${JSON.stringify(data.url)}, '_blank');
})();
`,
	};
	if (!data.isError) {
		aProps.href = data.url;
		aProps.target = "_blank";
		aProps.rel = "noopener noreferrer";
	}
	const children: any[] = [];
	if (data.isError) {
		children.push(
			h("div", { class: "link-card__info" }, [
				h("div", { class: "link-card__title" }, ["Error loading link"]),
				h("div", { class: "link-card__url" }, [data.url]),
			]),
		);
	} else {
		children.push(
			h("div", { class: "link-card__info" }, [
				h("div", { class: "link-card__title" }, [data.title]),
				h("div", { class: "link-card__description" }, [data.description]),
				h("div", { class: "link-card__meta" }, [
					h("img", {
						class: "link-card__favicon",
						src: data.faviconSrc,
						alt: "",
					}),
					h("span", {}, [punycode.toUnicode(data.domainName)]),
					data.date && h("span", {}, [data.date]),
				]),
			]),
		);
	}
	if (data.thumbnailSrc) {
		children.push(
			h("div", { class: "link-card__thumbnail" }, [
				h("img", {
					class: "link-card__image",
					src: data.thumbnailSrc,
					alt: data.thumbnailAlt,
				}),
			]),
		);
	}
	return {
		type: "text",
		value: "",
		data: {
			hName: "div",
			hProperties: { class: "link-card__container" },
			hChildren: [h("a", aProps, children)],
		},
	};
}

export default remarkLinkCard;
