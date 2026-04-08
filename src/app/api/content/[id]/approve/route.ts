import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ContentIdSchema } from "@/lib/schemas";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const parsed = ContentIdSchema.safeParse({ id });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data: author, error: authorError } = await supabase
    .from("authors")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (authorError || !author) {
    return NextResponse.json({ error: "Author profile not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("content_items")
    .update({ status: "approved", updated_at: new Date().toISOString() })
    .eq("id", parsed.data.id)
    .eq("author_id", author.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Content not found" }, { status: 404 });
  }

  return NextResponse.json({ item: data });
}
