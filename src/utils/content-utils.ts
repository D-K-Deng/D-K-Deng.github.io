import { type CollectionEntry, getCollection } from "astro:content";

import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import { getCategoryUrl } from "@utils/url-utils.ts";

import type { BlogPostData } from "../types/config";

// Retrieve posts and sort them by publication date
async function getRawSortedPosts() {
  const allBlogPosts = await getCollection("posts", ({ data }) => {
    return import.meta.env.PROD ? data.draft !== true : true;
  });

  const sorted = allBlogPosts.sort((a, b) => {
    const dateA = new Date(a.data.published);
    const dateB = new Date(b.data.published);
    return dateA > dateB ? -1 : 1;
  });
  return sorted;
}

export async function getSortedPosts() {
  const sorted = await getRawSortedPosts();

  for (let i = 1; i < sorted.length; i++) {
    sorted[i].data.nextSlug = sorted[i - 1].slug;
    sorted[i].data.nextTitle = sorted[i - 1].data.title;
  }
  for (let i = 0; i < sorted.length - 1; i++) {
    sorted[i].data.prevSlug = sorted[i + 1].slug;
    sorted[i].data.prevTitle = sorted[i + 1].data.title;
  }

  return sorted;
}

export type PostForList = {
  slug: string;
  data: CollectionEntry<"posts">["data"];
};
export async function getSortedPostsList(): Promise<PostForList[]> {
  const sortedFullPosts = await getRawSortedPosts();

  // delete post.body
  const sortedPostsList = sortedFullPosts.map((post) => ({
    slug: post.slug,
    data: post.data,
  }));

  return sortedPostsList;
}

export type Tag = {
  name: string;
  count: number;
};

export async function getTagList(): Promise<Tag[]> {
  const allBlogPosts = await getCollection<"posts">("posts", ({ data }) => {
    return import.meta.env.PROD ? data.draft !== true : true;
  });

  const countMap: { [key: string]: number } = {};
  allBlogPosts.map((post: { data: { tags: string[] } }) => {
    post.data.tags.map((tag: string) => {
      if (!countMap[tag]) countMap[tag] = 0;
      countMap[tag]++;
    });
  });

  // sort tags
  const keys: string[] = Object.keys(countMap).sort((a, b) => {
    return a.toLowerCase().localeCompare(b.toLowerCase());
  });

  return keys.map((key) => ({ name: key, count: countMap[key] }));
}

export type Category = {
  name: string;
  count: number;
  url: string;
};

export async function getCategoryList(): Promise<Category[]> {
  const allBlogPosts = await getCollection<"posts">("posts", ({ data }) => {
    return import.meta.env.PROD ? data.draft !== true : true;
  });
  const count: { [key: string]: number } = {};
  allBlogPosts.map((post: { data: { category: string | null } }) => {
    if (!post.data.category) {
      const ucKey = i18n(I18nKey.uncategorized);
      count[ucKey] = count[ucKey] ? count[ucKey] + 1 : 1;
      return;
    }

    const categoryName =
      typeof post.data.category === "string"
        ? post.data.category.trim()
        : String(post.data.category).trim();

    count[categoryName] = count[categoryName] ? count[categoryName] + 1 : 1;
  });

  const lst = Object.keys(count).sort((a, b) => {
    return a.toLowerCase().localeCompare(b.toLowerCase());
  });

  const ret: Category[] = [];
  for (const c of lst) {
    ret.push({
      name: c,
      count: count[c],
      url: getCategoryUrl(c),
    });
  }
  return ret;
}

export async function getPostSeries(
  seriesName: string,
): Promise<{ body: string; data: BlogPostData; slug: string }[]> {
  const posts = (await getCollection("posts", ({ data }) => {
    return (
      (import.meta.env.PROD ? data.draft !== true : true) &&
      data.series === seriesName
    );
  })) as unknown as { body: string; data: BlogPostData; slug: string }[];

  posts.sort((a, b) => {
    const dateA = new Date(a.data.published);
    const dateB = new Date(b.data.published);
    return dateA > dateB ? 1 : -1;
  });

  return posts;
}

/**
 * 获取所有文章的 系列（series）分组
 * 返回结构：
 * [
 *   {
 *     name: 一级分类名,
 *     description: 一级分类简介,
 *     seriesList: [
 *       { name: 系列名, description: 系列简介, posts: [ ...文章列表 ] }
 *     ]
 *   }
 * ]
 */
export async function getAllSeriesGroups(): Promise<{
  name: string;
  description: string;
  seriesList: Array<{
    name: string;
    description: string;
    posts: { body: string; data: BlogPostData; slug: string }[];
  }>;
}[]> {
  // 1. 获取所有文章
  const all = (await getCollection("posts", ({ data }) => {
    return (
      (import.meta.env.PROD ? data.draft !== true : true) &&
      data.series &&              // 先做一次过滤
      data.seriesCategory
    );
  })) as unknown as { body: string; data: BlogPostData; slug: string }[];

  // 2. 两层分组：一级分类 → 系列
  const catMap = new Map<
    string,
    {
      description: string;
      seriesMap: Map<
        string,
        { description: string; posts: { body: string; data: BlogPostData; slug: string }[] }
      >;
    }
  >();

  for (const p of all) {
    // 再次类型保护，断言不是 undefined
    if (!p.data.seriesCategory || !p.data.series) continue;
    const cat = p.data.seriesCategory;                   // string
    const catDesc = p.data.seriesCategoryDescription ?? "";
    const s = p.data.series;                             // string
    const sDesc = p.data.seriesDescription ?? "";

    // 如果一级分类还没创建，就先 set
    if (!catMap.has(cat)) {
      catMap.set(cat, { description: catDesc, seriesMap: new Map() });
    }
    const cm = catMap.get(cat)!;

    // 如果该分类下的这个系列还没创建，就先 set
    if (!cm.seriesMap.has(s)) {
      cm.seriesMap.set(s, { description: sDesc, posts: [] });
    }
    // push 文章
    cm.seriesMap.get(s)!.posts.push(p);
  }

  // 3. 转成数组并返回
  return Array.from(catMap.entries()).map(([catName, { description, seriesMap }]) => ({
    name: catName,
    description,
    seriesList: Array.from(seriesMap.entries()).map(([sName, { description: sDesc, posts }]) => ({
      name: sName,
      description: sDesc,
      posts,
    })),
  }));
}
