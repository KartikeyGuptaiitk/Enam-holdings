"use client";
import Link from "next/link";
export default function ErrorPage({reset}:{reset:()=>void}){return <main style={{padding:32,maxWidth:500,margin:'auto'}}><p className="eyebrow">THE DESK / INTERRUPTED</p><h1>The evidence can wait.</h1><p>Something interrupted this view. Your saved disclosures remain unchanged.</p><button className="primary" onClick={reset}>Try this view again ↗</button><Link href="/">Return to Today</Link></main>}
