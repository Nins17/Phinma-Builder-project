"use client";

import { Button } from "@/components/ui/button";
import { TEMPLATE_HEADINGS } from "@/lib/upload-csv";

// Builds a CSV with just the heading row, right in the browser, and
// hands it to the teacher as a download.
export function TemplateButton() {
  function handleDownload() {
    const csv = TEMPLATE_HEADINGS.join(",") + "\r\n";
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "retake-upload-template.csv";
    link.click();
    // Free the file a moment later; freeing it straight away can cancel
    // the download in some browsers (older Safari).
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <Button variant="outline" onClick={handleDownload}>
      Download CSV template
    </Button>
  );
}
