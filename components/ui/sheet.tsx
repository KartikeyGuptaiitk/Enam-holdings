"use client";
import { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { spring } from '../../lib/motion';
export function Sheet({ title, children, close }: { title:string; children:React.ReactNode; close:()=>void }) {
 const ref=useRef<HTMLElement>(null); const reduced=useReducedMotion();
 useEffect(()=>{const prior=document.activeElement as HTMLElement; const body=document.body.style.overflow;document.body.style.overflow='hidden';ref.current?.focus(); const key=(e:KeyboardEvent)=>{if(e.key==='Escape')close();if(e.key==='Tab'){const items=ref.current?.querySelectorAll<HTMLElement>('button,input,select,a[href],[tabindex="0"]');if(!items?.length)return;const first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}};document.addEventListener('keydown',key);return()=>{document.body.style.overflow=body;document.removeEventListener('keydown',key);prior?.focus()}},[close]);
 return <div className="sheet-backdrop" onClick={close}><motion.section ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} className="sheet terminal-sheet" initial={{y:reduced?0:100,opacity:0}} animate={{y:0,opacity:1}} transition={spring} drag={reduced?false:'y'} dragConstraints={{top:0,bottom:0}} dragElastic={0.18} onDragEnd={(_,info)=>{if(info.offset.y>100||info.velocity.y>600)close()}} onClick={e=>e.stopPropagation()}><div className="sheet-handle"/><div className="sheet-header"><h2>{title}</h2><button aria-label="Close dialog" onClick={close}>×</button></div>{children}</motion.section></div>
}
