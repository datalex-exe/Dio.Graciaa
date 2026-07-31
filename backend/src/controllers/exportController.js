import { PrismaClient } from '@prisma/client';
import ExcelJS from 'exceljs';

const prisma = new PrismaClient();

export async function exportBuildingGrid(req, res) {
  const { buildingId } = req.params;

  try {
    const building = await prisma.building.findUnique({
      where: { id: buildingId },
      include: {
        order: {
          select: { orderNumber: true }
        }
      }
    });

    if (!building) {
      return res.status(404).json({ error: 'Building not found' });
    }

    const apartments = await prisma.apartment.findMany({
      where: { buildingId },
      orderBy: { srNo: 'asc' }
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(building.name);

    // Style variables
    const headerFill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    const groupFills = {
      group1: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD2EBD4' } }, // Light green
      group2: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0FE' } }, // Light blue
      group3: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE8E6' } }, // Light red
      group4: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEEFC3' } }, // Light yellow
      group5: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6C2FF' } }, // Light purple
      group6: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE4F2E7' } }, // Mint
      group7: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEBEE' } }, // Rose
      group8: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3E5F5' } }  // Lavender
    };

    // Columns structure
    const columns = [
      // Group 1
      { header: 'Sr No', key: 'srNo', width: 8, group: 'group1' },
      { header: 'Apartment No', key: 'apartmentNo', width: 15, group: 'group1' },
      { header: 'Floor', key: 'floor', width: 10, group: 'group1' },
      { header: 'Priority', key: 'priority', width: 12, group: 'group1' },
      { header: 'Kitchen Qty', key: 'kitchenQty', width: 12, group: 'group1' },
      { header: 'Wardrobe Qty', key: 'wardrobeQty', width: 14, group: 'group1' },
      { header: 'Vanity Qty', key: 'vanityQty', width: 12, group: 'group1' },
      { header: 'Door Qty', key: 'doorQty', width: 12, group: 'group1' },

      // Group 2
      { header: 'Kit Lower Inw', key: 'kitchenLowerCarcassInward', width: 14, group: 'group2' },
      { header: 'Kit Upper Inw', key: 'kitchenUpperCarcassInward', width: 14, group: 'group2' },
      { header: 'Kit Stone Inw', key: 'kitchenStoneInward', width: 14, group: 'group2' },
      { header: 'Kit Shutters Inw', key: 'kitchenShutterInward', width: 15, group: 'group2' },
      { header: 'Kit Hardware Inw', key: 'kitchenHardwareInward', width: 15, group: 'group2' },
      { header: 'Kit Appliances Inw', key: 'kitchenApplianceInward', width: 16, group: 'group2' },
      { header: 'Ward Cabinets Inw', key: 'wardrobeCabinetInward', width: 16, group: 'group2' },
      { header: 'Ward Shutter Hdw Inw', key: 'wardrobeShutterHardwareInward', width: 20, group: 'group2' },
      { header: 'Van Cabinets Inw', key: 'vanityCabinetInward', width: 16, group: 'group2' },
      { header: 'Van Shutter Hdw Inw', key: 'vanityShutterHardwareInward', width: 20, group: 'group2' },
      { header: 'Door & Har Inw', key: 'doorFrameHardwareInward', width: 16, group: 'group2' },

      // Group 3
      { header: 'Kit Lower Inst', key: 'kitchenLowerCarcassInstalled', width: 14, group: 'group3' },
      { header: 'Kit Upper Inst', key: 'kitchenUpperCarcassInstalled', width: 14, group: 'group3' },
      { header: 'Kit Stone Inst', key: 'kitchenStoneInstalled', width: 14, group: 'group3' },
      { header: 'Kit Shutters Hdw Inst', key: 'kitchenShutterHardwareInstalled', width: 20, group: 'group3' },
      { header: 'Kit Appliances Inst', key: 'kitchenApplianceInstalled', width: 18, group: 'group3' },
      { header: 'Kit Handed Over', key: 'kitchenHandedOver', width: 16, group: 'group3' },
      { header: 'Ward Cabinets Inst', key: 'wardrobeCabinetInstalled', width: 18, group: 'group3' },
      { header: 'Ward Shutter Hdw Inst', key: 'wardrobeShutterHardwareInstalled', width: 22, group: 'group3' },
      { header: 'Ward Handed Over', key: 'wardrobeHandedOver', width: 18, group: 'group3' },
      { header: 'Van Cabinets Inst', key: 'vanityCabinetInstalled', width: 18, group: 'group3' },
      { header: 'Van Shutter Hdw Inst', key: 'vanityShutterHardwareInstalled', width: 22, group: 'group3' },
      { header: 'Van Handed Over', key: 'vanityHandedOver', width: 18, group: 'group3' },
      { header: 'Door & Har Inst', key: 'doorFrameHardwareInstalled', width: 18, group: 'group3' },
      { header: 'Door Handed Over', key: 'doorHandedOver', width: 18, group: 'group3' },

      // Group 4
      { header: 'Planned Start', key: 'plannedStart', width: 15, group: 'group4' },
      { header: 'Planned Comp', key: 'plannedCompletion', width: 15, group: 'group4' },
      { header: 'Actual Start', key: 'actualStart', width: 15, group: 'group4' },
      { header: 'Actual Comp', key: 'actualCompletion', width: 15, group: 'group4' },
      { header: 'Responsible Eng', key: 'responsibleEngineer', width: 18, group: 'group4' },
      { header: 'Contractor', key: 'contractor', width: 15, group: 'group4' },
      { header: 'Delay Reason', key: 'delayReason', width: 20, group: 'group4' },
      { header: 'Remarks', key: 'remarks', width: 25, group: 'group4' },

      // Group 5
      { header: 'Mat Inward %', key: 'materialInwardPct', width: 15, group: 'group5' },
      { header: 'Kit Comp %', key: 'kitchenCompletionPct', width: 12, group: 'group5' },
      { header: 'Ward Comp %', key: 'wardrobeCompletionPct', width: 14, group: 'group5' },
      { header: 'Van Comp %', key: 'vanityCompletionPct', width: 12, group: 'group5' },
      { header: 'Door Comp %', key: 'doorCompletionPct', width: 12, group: 'group5' },
      { header: 'Overall Comp %', key: 'overallCompletionPct', width: 15, group: 'group5' },
      { header: 'Apt Status', key: 'apartmentStatus', width: 18, group: 'group5' },
      { header: 'Delay Days', key: 'delayDays', width: 12, group: 'group5' },
      { header: 'Health', key: 'health', width: 12, group: 'group5' },

      // Group 6
      { header: 'Kit QC: Screws', key: 'kitchenQC_VisibleScrews', width: 16, group: 'group6' },
      { header: 'Kit QC: Chips', key: 'kitchenQC_Chipping', width: 16, group: 'group6' },
      { header: 'Kit QC: Filler', key: 'kitchenQC_FillerMissing', width: 16, group: 'group6' },
      { header: 'Kit QC: Scratches', key: 'kitchenQC_Scratches', width: 16, group: 'group6' },
      { header: 'Kit QC: Drawers', key: 'kitchenQC_DrawersFunction', width: 16, group: 'group6' },
      { header: 'Kit QC: Cutlery', key: 'kitchenQC_CutleryTray', width: 16, group: 'group6' },
      { header: 'Kit QC: Drainer', key: 'kitchenQC_DishDrainer', width: 16, group: 'group6' },

      { header: 'Ward QC: Screws', key: 'wardrobeQC_VisibleScrews', width: 16, group: 'group6' },
      { header: 'Ward QC: Chips', key: 'wardrobeQC_Chipping', width: 16, group: 'group6' },
      { header: 'Ward QC: Filler', key: 'wardrobeQC_FillerMissing', width: 16, group: 'group6' },
      { header: 'Ward QC: Scratches', key: 'wardrobeQC_Scratches', width: 16, group: 'group6' },
      { header: 'Ward QC: Drawers', key: 'wardrobeQC_DrawersFunction', width: 16, group: 'group6' },

      { header: 'Van QC: Screws', key: 'vanityQC_VisibleScrews', width: 16, group: 'group6' },
      { header: 'Van QC: Chips', key: 'vanityQC_Chipping', width: 16, group: 'group6' },
      { header: 'Van QC: Filler', key: 'vanityQC_FillerMissing', width: 16, group: 'group6' },
      { header: 'Van QC: Scratches', key: 'vanityQC_Scratches', width: 16, group: 'group6' },
      { header: 'Van QC: Drawers', key: 'vanityQC_DrawersFunction', width: 16, group: 'group6' },

      { header: 'Door QC: Chips', key: 'doorQC_Chipping', width: 16, group: 'group6' },
      { header: 'Door QC: Align', key: 'doorQC_Alignment', width: 16, group: 'group6' },

      // Group 7
      { header: 'Kit QC Gate', key: 'kitchenQCGate', width: 14, group: 'group7' },
      { header: 'Ward QC Gate', key: 'wardrobeQCGate', width: 15, group: 'group7' },
      { header: 'Van QC Gate', key: 'vanityQCGate', width: 14, group: 'group7' },
      { header: 'Door QC Gate', key: 'doorQCGate', width: 14, group: 'group7' },
      { header: 'Handover Status', key: 'handoverApprovalStatus', width: 22, group: 'group7' },

      // Group 8
      { header: 'Kit Type', key: 'kitchenType', width: 12, group: 'group8' },
      { header: 'Ward Type', key: 'wardrobeType', width: 12, group: 'group8' },
      { header: 'Van Type', key: 'vanityType', width: 12, group: 'group8' },
      { header: 'Door Type', key: 'doorType', width: 12, group: 'group8' }
    ];

    worksheet.columns = columns.map(c => ({
      header: c.header,
      key: c.key,
      width: c.width
    }));

    // Apply header group styling
    const headerRow = worksheet.getRow(1);
    headerRow.height = 30;

    columns.forEach((col, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.fill = groupFills[col.group];
      cell.font = { bold: true, name: 'Calibri', size: 11 };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'medium' },
        right: { style: 'thin' }
      };
    });

    // Add rows
    apartments.forEach(apt => {
      const rowData = {};
      columns.forEach(col => {
        let val = apt[col.key];

        // Format Date fields
        if (val instanceof Date) {
          val = val.toISOString().split('T')[0];
        }

        // Format Percentages for display
        if (col.key.endsWith('Pct')) {
          val = `${(val * 100).toFixed(1)}%`;
        }

        // Format Multi-Types for Wardrobe and Vanity
        if ((col.key === 'wardrobeType' || col.key === 'vanityType') && typeof val === 'string' && val.startsWith('[')) {
          try {
            const list = JSON.parse(val);
            val = list.map(item => `${item.type} (${item.qty})`).join(', ');
          } catch (e) { }
        }

        rowData[col.key] = val !== null ? val : '';
      });

      const row = worksheet.addRow(rowData);
      row.height = 20;

      // Center values for numeric or status fields
      columns.forEach((col, idx) => {
        const cell = row.getCell(idx + 1);
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
        if (typeof cell.value === 'number' || col.key.endsWith('Pct') || col.key === 'srNo') {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Grid_${building.name.replace(/\s+/g, '_')}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Export Excel error:', err);
    return res.status(500).json({ error: 'Internal server error exporting building data' });
  }
}
