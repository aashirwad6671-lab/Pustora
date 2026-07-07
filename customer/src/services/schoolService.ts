// ============================================================
// schoolService.ts — Data fetching for Schools & Combos
// All reads go through Supabase. Used by Next.js SSR pages.
// ============================================================

import { createClient } from '@supabase/supabase-js';
import type { School, SchoolClass, Combo, ComboItem, Product } from '../types';

// ── Server-side Supabase (for SSR / generateStaticParams) ───
function getServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

// ── All active schools ───────────────────────────────────────
export async function getAllSchools(): Promise<School[]> {
  const supabase = getServerClient();
  const { data, error } = await supabase
    .from('schools')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data ?? []) as School[];
}

// ── Featured schools only (for homepage SDUI school widget) ─
export async function getFeaturedSchools(): Promise<School[]> {
  const supabase = getServerClient();
  const { data, error } = await supabase
    .from('schools')
    .select('*')
    .eq('is_active', true)
    .eq('is_featured', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data ?? []) as School[];
}

// ── School by slug (for /school/[slug] page) ─────────────────
export async function getSchoolBySlug(slug: string): Promise<School | null> {
  const supabase = getServerClient();
  const { data, error } = await supabase
    .from('schools')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error) return null;
  return data as School;
}

// ── All classes for a school (for /school/[slug] listing) ───
export async function getClassesForSchool(schoolId: string): Promise<SchoolClass[]> {
  const supabase = getServerClient();
  const { data, error } = await supabase
    .from('school_classes')
    .select('*')
    .eq('school_id', schoolId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data ?? []) as SchoolClass[];
}

// ── Combos for a specific school class ───────────────────────
export async function getCombosForClass(schoolClassId: string): Promise<Combo[]> {
  const supabase = getServerClient();
  const { data, error } = await supabase
    .from('combos')
    .select(`
      *,
      school_classes (
        *,
        schools (*)
      )
    `)
    .eq('school_class_id', schoolClassId)
    .eq('is_active', true)
    .order('total_price', { ascending: true });

  if (error) throw error;
  return (data ?? []) as Combo[];
}

// ── Full combo with all items + product details ──────────────
export async function getComboWithItems(
  comboId: string
): Promise<{ combo: Combo; items: ComboItem[] } | null> {
  const supabase = getServerClient();

  const [{ data: combo, error: cErr }, { data: items, error: iErr }] =
    await Promise.all([
      supabase
        .from('combos')
        .select(`*, school_classes(*, schools(*))`)
        .eq('id', comboId)
        .single(),
      supabase
        .from('combo_items')
        .select(`*, products(*)`)
        .eq('combo_id', comboId),
    ]);

  if (cErr || !combo) return null;
  return { combo: combo as Combo, items: (items ?? []) as ComboItem[] };
}

// ── School class by school slug + class slug ─────────────────
// Used by /school/[slug]/[classSlug] SSR page
export async function getSchoolClassBySlug(
  schoolSlug: string,
  classSlug: string
): Promise<{ school: School; schoolClass: SchoolClass; combos: Combo[] } | null> {
  const supabase = getServerClient();

  // 1. Fetch school
  const { data: school, error: sErr } = await supabase
    .from('schools')
    .select('*')
    .eq('slug', schoolSlug)
    .eq('is_active', true)
    .single();

  if (sErr || !school) return null;

  // 2. Fetch the class
  const { data: schoolClass, error: cErr } = await supabase
    .from('school_classes')
    .select('*')
    .eq('school_id', school.id)
    .eq('class_slug', classSlug)
    .eq('is_active', true)
    .single();

  if (cErr || !schoolClass) return null;

  // 3. Fetch combos for this class
  const { data: combos, error: coErr } = await supabase
    .from('combos')
    .select(`*, school_classes(*, schools(*))`)
    .eq('school_class_id', schoolClass.id)
    .eq('is_active', true);

  if (coErr) return null;

  return {
    school: school as School,
    schoolClass: schoolClass as SchoolClass,
    combos: (combos ?? []) as Combo[],
  };
}

// ── All combo items with products for a given combo ──────────
export async function getComboItems(comboId: string): Promise<ComboItem[]> {
  const supabase = getServerClient();
  const { data, error } = await supabase
    .from('combo_items')
    .select(`*, products(*)`)
    .eq('combo_id', comboId);

  if (error) throw error;
  return (data ?? []) as ComboItem[];
}
