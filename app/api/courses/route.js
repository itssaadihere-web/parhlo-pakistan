import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';
import backupCourses from '@/old_courses_backup.json';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const limit = searchParams.get('limit');
    const featured = searchParams.get('featured');

    let query = supabase.from('courses').select('*').order('created_at', { ascending: false });

    if (slug) {
      query = query.eq('slug', slug);
    }
    if (limit) {
      query = query.limit(parseInt(limit, 10));
    } else if (featured === 'true') {
      query = query.limit(3);
    }

    const { data, error } = await query;

    if (!error && data && data.length > 0) {
      return NextResponse.json(slug ? data[0] : data, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      });
    }

    // Fallback to backupCourses if DB returned empty or errored
    if (slug) {
      const found = (backupCourses || []).find((c) => c.slug === slug);
      if (found) {
        return NextResponse.json(found);
      }
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    let fallbackData = backupCourses || [];
    if (featured === 'true' || limit) {
      fallbackData = fallbackData.slice(0, parseInt(limit || '3', 10));
    }

    return NextResponse.json(fallbackData, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (err) {
    console.error('API /api/courses error:', err);
    return NextResponse.json(backupCourses || [], { status: 200 });
  }
}
