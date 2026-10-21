"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function RemoveSectionButton({
  section,
  count,
}: {
  section: string;
  count: number;
}) {
  const router = useRouter();
  const [removing, setRemoving] = useState(false);

  async function handleRemove() {
    const sure = window.confirm(
      `Remove all ${count} ${section} records?\n\nStudents in ${section} will no longer be able to check their retakes. You can add the section again by uploading its CSV.`,
    );
    if (!sure) return;

    setRemoving(true);
    const { data, error } = await createClient().rpc("remove_section_records", {
      p_section: section,
    });
    setRemoving(false);

    if (error) {
      window.alert(`Nothing was removed: ${error.message}`);
      return;
    }
    window.alert(`Removed ${data} ${section} records.`);
    router.refresh(); // reload the section tables
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleRemove}
      disabled={removing}
    >
      {removing ? "Removing…" : "Remove section"}
    </Button>
  );
}
