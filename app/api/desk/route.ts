import {NextResponse} from 'next/server';
import {snapshot} from '../../../lib/data';
export function GET(){return NextResponse.json(snapshot().research)}
