import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';
import backupCourses from '@/old_courses_backup.json';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ error: 'Slug parameter is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('slug', slug)
      .single();

    if (!error && data) {
      return NextResponse.json(data, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      });
    }

    // Fallback to backup json if Supabase failed or course not in DB
    const found = (backupCourses || []).find((c) => c.slug === slug);
    if (found) {
      return NextResponse.json(found, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      });
    }

    return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  } catch (err) {
    console.error('API /api/courses/[slug] error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
