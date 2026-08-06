"use client";

import { universities } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/client";

export type WorkspaceRemoteState = {
  userId: string | null;
  savedUniversityIds: string[];
  compareUniversityIds: string[];
};

type UniversityRelation =
  | {
      legacy_id: string | null;
      slug: string | null;
    }
  | Array<{
      legacy_id: string | null;
      slug: string | null;
    }>
  | null;

type FavoriteResultRow = {
  university: UniversityRelation;
};

type ComparisonResultRow = {
  position: number;
  university: UniversityRelation;
};

const localToUniversityKey = new Map(
  universities.map((university) => [
    university.id,
    university.slug,
  ]),
);

const legacyToLocalId = new Map(
  universities.map((university) => [
    university.legacyId,
    university.id,
  ]),
);

const slugToLocalId = new Map(
  universities.map((university) => [
    university.slug,
    university.id,
  ]),
);

function relationValue(
  value: UniversityRelation,
) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function localIdFromRelation(
  value: UniversityRelation,
) {
  const university = relationValue(value);

  if (!university) {
    return null;
  }

  if (university.legacy_id) {
    const localId =
      legacyToLocalId.get(
        university.legacy_id,
      );

    if (localId) {
      return localId;
    }
  }

  if (university.slug) {
    return (
      slugToLocalId.get(university.slug) ??
      null
    );
  }

  return null;
}

function requireUniversityKey(localId: string) {
  const universityKey =
    localToUniversityKey.get(localId);

  if (!universityKey) {
    throw new Error(
      "This university is not linked to the catalogue.",
    );
  }

  return universityKey;
}

async function requireAuthenticatedClient() {
  const supabase = createClient();

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  if (!session?.user) {
    throw new Error("Authentication required");
  }

  return supabase;
}

export async function loadWorkspaceRemoteState():
  Promise<WorkspaceRemoteState> {
  const supabase = createClient();

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  const user = session?.user ?? null;

  if (!user) {
    return {
      userId: null,
      savedUniversityIds: [],
      compareUniversityIds: [],
    };
  }

  const [
    favoriteResult,
    comparisonResult,
  ] = await Promise.all([
    supabase
      .from("university_favorites")
      .select(
        "university:universities!inner(legacy_id,slug)",
      )
      .eq("user_id", user.id)
      .order("created_at", {
        ascending: true,
      }),

    supabase
      .from("university_comparison_items")
      .select(
        "position, university:universities!inner(legacy_id,slug)",
      )
      .eq("user_id", user.id)
      .order("position", {
        ascending: true,
      }),
  ]);

  if (favoriteResult.error) {
    throw favoriteResult.error;
  }

  if (comparisonResult.error) {
    throw comparisonResult.error;
  }

  const favoriteRows = (
    favoriteResult.data ?? []
  ) as FavoriteResultRow[];

  const comparisonRows = (
    comparisonResult.data ?? []
  ) as ComparisonResultRow[];

  return {
    userId: user.id,

    savedUniversityIds: favoriteRows
      .map((row) =>
        localIdFromRelation(row.university),
      )
      .filter(
        (id): id is string => Boolean(id),
      ),

    compareUniversityIds: comparisonRows
      .map((row) =>
        localIdFromRelation(row.university),
      )
      .filter(
        (id): id is string => Boolean(id),
      )
      .slice(0, 4),
  };
}

export async function toggleFavoriteRemote(
  localId: string,
) {
  const supabase =
    await requireAuthenticatedClient();

  const { data, error } = await supabase.rpc(
    "toggle_university_favorite",
    {
      p_legacy_id:
        requireUniversityKey(localId),
    },
  );

  if (error) {
    throw error;
  }

  return data === true;
}

export async function toggleComparisonRemote(
  localId: string,
) {
  const supabase =
    await requireAuthenticatedClient();

  const { data, error } = await supabase.rpc(
    "toggle_university_comparison",
    {
      p_legacy_id:
        requireUniversityKey(localId),
    },
  );

  if (error) {
    throw error;
  }

  return data === true;
}

export async function clearComparisonRemote() {
  const supabase =
    await requireAuthenticatedClient();

  const { error } = await supabase.rpc(
    "clear_university_comparison",
  );

  if (error) {
    throw error;
  }
}

