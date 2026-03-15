---

title: "MiniQUIC: Building a QUIC-Inspired Transport in Python"
published: 2025-12-10
description: 'A lightweight QUIC-inspired transport protocol built on top of UDP with encryption, multiplexed streams, retransmissions, flow control, congestion control, and a terminal chat and file-transfer UI.'
image: ''
tags: [Python, Computer Network]
category: 'Projects'
draft: false
seriesCategory: "Projects"
seriesCategoryDescription: "My Projects"
series: "Computer Science"
seriesDescription: "Projects exploring core concepts and applications in computer science, including algorithms, data structures, and software development"

---

::github{repo="D-K-Deng/py-miniquic"}

## Abstract

This project is a lightweight QUIC-inspired transport protocol implemented in Python on top of UDP. Instead of relying on TCP's built-in reliability and ordering guarantees, I built a compact user-space transport layer that adds connection identifiers, encrypted packets, multiplexed streams, acknowledgments, retransmissions, flow control, congestion control, and a terminal interface for chat and file transfer.

What interested me most here was the layering. UDP gives a minimal datagram substrate, but almost everything people associate with a modern transport protocol has to be rebuilt above it: handshake logic, packet protection, sequencing, delivery guarantees, stream management, and application-facing interaction. The result is not meant to be wire-compatible with standard QUIC. It is a smaller protocol designed to make the structure of transport engineering visible.

## Introduction

I wanted this project to sit in the space between theory and systems work. QUIC is one of the most interesting modern transport designs because it combines reliability, multiplexing, and cryptographic protection while avoiding many of the bottlenecks of older transport stacks. Reproducing full QUIC is a major undertaking, but building a smaller QUIC-inspired system is a great way to understand the moving parts.

That is what shaped MiniQUIC. I used UDP as the network substrate and then layered on the transport features that actually make the system usable:

- connection identifiers and packet numbers
- a handshake based on X25519 key exchange
- AES-GCM packet protection
- framed payloads for data, ACKs, window updates, and handshake messages
- retransmission timers and cumulative acknowledgments
- stream-level and connection-level flow control
- AIMD-style congestion control
- a Textual-based terminal UI for chat and file transfer

The final result feels less like a socket demo and more like a compact transport stack.

## Protocol Design

### UDP as the Substrate

The project starts from a simple decision: use UDP for transport and implement reliability in user space. That immediately gives the protocol more freedom, but it also creates more responsibility. Packet boundaries are preserved, but ordering, retransmission, and congestion behavior are no longer handled by the operating system.

To make the protocol stateful, each datagram carries a small authenticated header:

```text
MAGIC(2) | FLAGS(1) | CONN_ID(8) | PKT_NUM(4)
```

This gives the receiver enough information to identify the connection, interpret packet properties, and place the packet into the transport state machine. The header itself is not encrypted, but it is authenticated as AEAD additional authenticated data, which keeps the packet layout inspectable while still protecting against tampering.

### Handshake and Packet Protection

The cryptographic layer uses an X25519 handshake followed by AES-GCM packet protection. The workflow is intentionally compact:

1. client and server exchange handshake frames containing public keys
2. each side derives symmetric traffic keys from the shared secret
3. once keys are installed, payloads are encrypted and authenticated

The nonce is derived from the connection identifier and packet number:

```text
NONCE = CONN_ID || PKT_NUM_BE32
```

and the unencrypted header is passed as AAD. I liked this split because it mirrors a key design idea in modern encrypted transports: packet metadata can remain visible enough for routing and state handling, while application-bearing content is protected.

### Framed Payloads

Instead of treating each datagram as one opaque message, MiniQUIC encodes the payload as a sequence of explicit frames. That makes the transport easier to extend and easier to reason about.

The core frame types are:

- `FT_PING (0x00)` for ack-eliciting keepalive behavior
- `FT_ACK (0x01)` for cumulative acknowledgments
- `FT_STREAM (0x02)` for stream data with offsets and optional final flag
- `FT_WINDOW_UPDATE (0x03)` for flow-control updates
- `FT_HANDSHAKE (0x04)` for the initial key exchange

For example, the stream frame layout is:

```text
FT_STREAM(1) | SID(4) | OFFSET(4) | FIN(1) | LEN(2) | BYTES
```

This is where the transport becomes more than encrypted UDP. Once frames exist, the protocol can multiplex multiple logical activities, acknowledge progress, and separate transport control from application data.

### Reliability and Retransmissions

Reliability is built around packet numbers, cumulative ACKs, and retransmission timers. Every ack-eliciting packet is tracked in flight, and the receiver can acknowledge progress with:

```text
FT_ACK(1) | ACKED_PN(4) | ACK_DELAY(2)
```

The acknowledgment is cumulative up to the given packet number. On the sender side, in-flight packets are retained until they are acknowledged or time out. If the retransmission timer fires, the packet is resent and the backoff logic updates the connection state.

What makes this part interesting is that reliability is not a single mechanism. It is a coordinated interaction between packet numbering, timer management, congestion state, and buffer bookkeeping.

### Streams, Flow Control, and Congestion Control

One of the most useful aspects of QUIC-style design is stream multiplexing, and I kept that idea in MiniQUIC. Text messages and file transfers are both carried over stream frames, with per-stream offsets and reassembly state.

Flow control is enforced at two levels:

- connection-level receive limits
- stream-level receive windows

As the application consumes buffered data, the protocol emits `FT_WINDOW_UPDATE` frames to advertise newly available capacity. This prevents the sender from overwhelming either the entire connection or an individual stream.

Congestion control follows a compact AIMD model:

- slow start below `ssthresh`
- additive increase above `ssthresh`
- multiplicative decrease on timeout

That makes the transport behavior responsive to loss without turning the project into a full congestion-control research exercise.

## Code Deployment

The project is intentionally easy to run. After installing dependencies:

```bash
pip install -r requirements.txt
```

the server can be started with:

```bash
python miniquic.py server 0.0.0.0 4444
```

and the client with:

```bash
python miniquic.py client 127.0.0.1 4444
```

The terminal UI launches automatically. Text entered in the input bar is sent over a stream, and files can be uploaded directly from the local machine. Received files are written to `downloads_server/` or `downloads_client/`, which makes the protocol easy to test interactively rather than only through synthetic traces.

## Implementation

### Connection State and Crypto Installation

The implementation centers around a shared per-connection state object that tracks:

- peer addressing and connection identifiers
- installed transmit and receive crypto contexts
- packet numbers and in-flight retransmission data
- congestion parameters such as `cwnd`, `ssthresh`, and `rto`
- flow-control limits
- stream send and receive buffers
- application receive queues

The crypto helpers install keys once the peer public key is received. Functions like `_install_crypto`, `server_key_install`, and `client_key_install` make the transition from cleartext handshake traffic to protected payloads explicit, which keeps the code easier to follow than if encryption were woven implicitly through every send path.

### Packet and Frame Processing

The transport logic in `miniquic.py` handles packet assembly, frame parsing, acknowledgment processing, retransmission scheduling, and stream reassembly in one integrated loop. That sounds dense, but the framing model helps keep responsibilities separate.

Handshake messages establish keys. Stream frames move application bytes. ACK frames advance delivery state. Window update frames coordinate flow control. Because all of these are explicit frame types, the transport can evolve without needing separate packet formats for every feature.

I also appreciated how packet number tracking and retransmission logic forced the implementation to become more disciplined. Reliability stops being an abstract guarantee and turns into concrete state transitions.

### Application Layer and Terminal UI

On top of the transport, I added a small application protocol with three message kinds:

- text messages
- file payloads
- file-delivery acknowledgments

The `ChatUI` built with Textual gives the protocol a real front end. Messages are displayed in a live log, uploads can be triggered from the interface, and received files are saved automatically. This made the project much more satisfying than a purely headless transport because it exposed the protocol through a tangible user workflow.

In practice, that is also where the protocol design gets validated. A transport stack feels different once it has to support real interaction instead of only passing unit-level test cases.

## What This Project Taught Me

What I liked most about MiniQUIC is that it made transport protocol design feel compositional. Encryption, reliability, multiplexing, congestion control, and application behavior are often discussed as separate topics, but in implementation they constantly interact.

The handshake changes when encryption can begin. Encryption changes how packet layout is structured. Packet numbering and ACKs affect retransmission behavior. Retransmissions affect congestion state. Flow control shapes what streams are allowed to send. And the application layer ends up exposing whether the whole stack feels smooth or fragile.

That is why this project was so useful to build. It turned transport networking from a list of concepts into a working system with visible dependencies between layers. For me, that is the most satisfying kind of systems project: one where each mechanism is understandable on its own, but the real insight comes from seeing how they fit together.
