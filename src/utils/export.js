import jsPDF from 'jspdf'
import 'jspdf-autotable'
import Papa from 'papaparse'

/**
 * Export applications to CSV
 */
export function exportToCSV(applications, filename = 'applications.csv') {
    const data = applications.map(app => ({
        'Company': app.company,
        'Position': app.position,
        'Location': app.location || '',
        'Status': app.status,
        'Applied Date': app.applied_date ? new Date(app.applied_date).toLocaleDateString('fr-FR') : '',
        'Salary': app.salary || '',
        'Type': app.type || '',
        'Link': app.link || '',
        'Notes': app.notes || ''
    }))

    const csv = Papa.unparse(data)
    downloadFile(csv, filename, 'text/csv')
}

/**
 * Export applications to PDF with stats
 */
export function exportToPDF(applications, stats = {}, filename = 'job-tracker-report.pdf') {
    const doc = new jsPDF()

    // Title
    doc.setFontSize(20)
    doc.setTextColor(59, 130, 246) // Primary color
    doc.text('JobTracker - Application Report', 14, 22)

    // Date
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Generated on ${new Date().toLocaleDateString('fr-FR')}`, 14, 30)

    // Stats section
    if (stats && Object.keys(stats).length > 0) {
        doc.setFontSize(14)
        doc.setTextColor(0, 0, 0)
        doc.text('Statistics', 14, 42)

        doc.setFontSize(10)
        let yPos = 50

        if (stats.total !== undefined) {
            doc.text(`Total Applications: ${stats.total}`, 20, yPos)
            yPos += 6
        }
        if (stats.pending !== undefined) {
            doc.text(`Pending: ${stats.pending}`, 20, yPos)
            yPos += 6
        }
        if (stats.interviews !== undefined) {
            doc.text(`Interviews: ${stats.interviews}`, 20, yPos)
            yPos += 6
        }
        if (stats.offers !== undefined) {
            doc.text(`Offers: ${stats.offers}`, 20, yPos)
            yPos += 6
        }
        if (stats.rejected !== undefined) {
            doc.text(`Rejected: ${stats.rejected}`, 20, yPos)
            yPos += 6
        }

        yPos += 4
    } else {
        yPos = 42
    }

    // Applications table
    doc.setFontSize(14)
    doc.setTextColor(0, 0, 0)
    doc.text('Applications', 14, yPos)

    const tableData = applications.map(app => [
        app.company,
        app.position,
        app.status,
        app.applied_date ? new Date(app.applied_date).toLocaleDateString('fr-FR') : '-'
    ])

    doc.autoTable({
        startY: yPos + 6,
        head: [['Company', 'Position', 'Status', 'Applied Date']],
        body: tableData,
        theme: 'striped',
        headStyles: {
            fillColor: [59, 130, 246],
            textColor: 255,
            fontStyle: 'bold'
        },
        styles: {
            fontSize: 9,
            cellPadding: 3
        },
        columnStyles: {
            0: { cellWidth: 50 },
            1: { cellWidth: 60 },
            2: { cellWidth: 35 },
            3: { cellWidth: 35 }
        }
    })

    // Footer
    const pageCount = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(150, 150, 150)
        doc.text(
            `Page ${i} of ${pageCount}`,
            doc.internal.pageSize.getWidth() / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
        )
    }

    doc.save(filename)
}

/**
 * Export interviews to CSV
 */
export function exportInterviewsToCSV(interviews, filename = 'interviews.csv') {
    const data = interviews.map(interview => ({
        'Company': interview.company,
        'Position': interview.position,
        'Date': interview.interview_date ? new Date(interview.interview_date).toLocaleString('fr-FR') : '',
        'Type': interview.type,
        'Notes': interview.notes || '',
        'Research': interview.research || '',
        'Questions': interview.questions || ''
    }))

    const csv = Papa.unparse(data)
    downloadFile(csv, filename, 'text/csv')
}

/**
 * Export contacts to CSV
 */
export function exportContactsToCSV(contacts, filename = 'contacts.csv') {
    const data = contacts.map(contact => ({
        'Name': contact.name,
        'Company': contact.company || '',
        'Position': contact.position || '',
        'Email': contact.email || '',
        'Phone': contact.phone || '',
        'LinkedIn': contact.linkedin || '',
        'Notes': contact.notes || ''
    }))

    const csv = Papa.unparse(data)
    downloadFile(csv, filename, 'text/csv')
}

/**
 * Helper function to download file
 */
function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}
