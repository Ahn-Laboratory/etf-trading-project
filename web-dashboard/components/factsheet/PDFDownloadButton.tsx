"use client"

import { useState, useEffect } from "react"
import { Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ETFFactSheet } from "@/lib/types/factsheet"

interface PDFDownloadButtonProps {
  data: ETFFactSheet
  symbol: string
}

export function PDFDownloadButton({ data, symbol }: PDFDownloadButtonProps) {
  const [isClient, setIsClient] = useState(false)
  const [PDFComponents, setPDFComponents] = useState<{
    PDFDownloadLink: React.ComponentType<{
      document: React.ReactElement
      fileName: string
      children: (props: { loading: boolean; error: Error | null }) => React.ReactNode
    }>
    FactSheetPDF: React.ComponentType<{ data: ETFFactSheet }>
  } | null>(null)

  useEffect(() => {
    setIsClient(true)
    // Dynamically import react-pdf components only on client
    Promise.all([
      import("@react-pdf/renderer"),
      import("./FactSheetPDF"),
    ]).then(([reactPdf, factSheetModule]) => {
      setPDFComponents({
        PDFDownloadLink: reactPdf.PDFDownloadLink as unknown as typeof PDFComponents extends null ? never : NonNullable<typeof PDFComponents>["PDFDownloadLink"],
        FactSheetPDF: factSheetModule.FactSheetPDF,
      })
    })
  }, [])

  const fileName = `${symbol}_FactSheet_${new Date().toISOString().split("T")[0]}.pdf`

  // Loading state while client-side hydration or module loading
  if (!isClient || !PDFComponents) {
    return (
      <Button disabled>
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Loading...
      </Button>
    )
  }

  const { PDFDownloadLink, FactSheetPDF } = PDFComponents

  return (
    <PDFDownloadLink
      document={<FactSheetPDF data={data} />}
      fileName={fileName}
    >
      {({ loading, error }) => (
        <Button disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : error ? (
            <>
              <Download className="h-4 w-4 mr-2" />
              Error - Retry
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              PDF Download
            </>
          )}
        </Button>
      )}
    </PDFDownloadLink>
  )
}

export default PDFDownloadButton
