import jsPDF from "jspdf"
import html2canvas from "html2canvas"

export async function downloadFactSheetPDF(
  elementId: string,
  filename: string,
  options?: {
    scale?: number
    margin?: number
  }
): Promise<void> {
  const element = document.getElementById(elementId)

  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`)
  }

  const scale = options?.scale ?? 2
  const margin = options?.margin ?? 10

  // 다크모드인 경우 일시적으로 라이트 모드로 변경
  const isDarkMode = document.documentElement.classList.contains("dark")
  if (isDarkMode) {
    document.documentElement.classList.remove("dark")
  }

  // html2canvas의 oklch/lab 색상 경고 억제
  const originalWarn = console.warn
  const originalError = console.error
  const originalLog = console.log

  const colorWarningFilter = (...args: unknown[]) => {
    const message = String(args[0] || "")
    if (message.includes("unsupported color function")) {
      return true // 필터링됨
    }
    return false
  }

  console.warn = (...args: unknown[]) => {
    if (!colorWarningFilter(...args)) {
      originalWarn.apply(console, args)
    }
  }
  console.error = (...args: unknown[]) => {
    if (!colorWarningFilter(...args)) {
      originalError.apply(console, args)
    }
  }
  console.log = (...args: unknown[]) => {
    if (!colorWarningFilter(...args)) {
      originalLog.apply(console, args)
    }
  }

  try {
    // html2canvas로 DOM 캡처
    const canvas = await html2canvas(element, {
      scale: scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      onclone: (clonedDoc) => {
        // 클론된 문서에서 oklch/lab 색상을 가진 요소들의 스타일을 처리
        const root = clonedDoc.documentElement
        root.style.setProperty("--background", "#ffffff")
        root.style.setProperty("--foreground", "#0a0a0a")
        root.style.setProperty("--card", "#ffffff")
        root.style.setProperty("--card-foreground", "#0a0a0a")
        root.style.setProperty("--popover", "#ffffff")
        root.style.setProperty("--popover-foreground", "#0a0a0a")
        root.style.setProperty("--primary", "#6366f1")
        root.style.setProperty("--primary-foreground", "#fafafa")
        root.style.setProperty("--secondary", "#f5f5f5")
        root.style.setProperty("--secondary-foreground", "#171717")
        root.style.setProperty("--muted", "#f5f5f5")
        root.style.setProperty("--muted-foreground", "#737373")
        root.style.setProperty("--accent", "#f5f5f5")
        root.style.setProperty("--accent-foreground", "#171717")
        root.style.setProperty("--destructive", "#ef4444")
        root.style.setProperty("--border", "#e5e5e5")
        root.style.setProperty("--input", "#e5e5e5")
        root.style.setProperty("--ring", "#a3a3a3")
        root.style.setProperty("--chart-1", "#a5b4fc")
        root.style.setProperty("--chart-2", "#818cf8")
        root.style.setProperty("--chart-3", "#6366f1")
        root.style.setProperty("--chart-4", "#4f46e5")
        root.style.setProperty("--chart-5", "#4338ca")
      },
    })

    // A4 사이즈 계산 (mm)
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    })

    const pageWidth = 210 // A4 width in mm
    const pageHeight = 297 // A4 height in mm
    const contentWidth = pageWidth - margin * 2
    const contentHeight = pageHeight - margin * 2

    // 이미지 크기 계산
    const imgWidth = contentWidth
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    // 캔버스를 이미지 데이터로 변환
    const imgData = canvas.toDataURL("image/png")

    // 페이지 분할 처리
    let heightLeft = imgHeight
    let position = margin

    // 첫 페이지
    pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight)
    heightLeft -= contentHeight

    // 추가 페이지가 필요한 경우
    while (heightLeft > 0) {
      position = heightLeft - imgHeight + margin
      pdf.addPage()
      pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight)
      heightLeft -= contentHeight
    }

    // PDF 다운로드
    pdf.save(filename)
  } finally {
    // console 메소드 복원
    console.warn = originalWarn
    console.error = originalError
    console.log = originalLog

    // 다크모드 복원
    if (isDarkMode) {
      document.documentElement.classList.add("dark")
    }
  }
}

// 날짜 포맷팅 헬퍼
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

// 숫자 포맷팅 헬퍼
export function formatNumber(value: number): string {
  return value.toLocaleString("ko-KR")
}

// 금액 포맷팅 헬퍼 (달러)
export function formatCurrency(value: number, decimals = 2): string {
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`
}

// 대규모 금액 포맷팅 (억/조 단위)
export function formatLargeNumber(value: number): string {
  if (value >= 1e12) {
    return `$${(value / 1e12).toFixed(2)}T`
  } else if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`
  } else if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`
  }
  return `$${value.toLocaleString()}`
}

// 퍼센트 포맷팅
export function formatPercent(value: number, showSign = false): string {
  const formatted = value.toFixed(2)
  if (showSign && value > 0) {
    return `+${formatted}%`
  }
  return `${formatted}%`
}
