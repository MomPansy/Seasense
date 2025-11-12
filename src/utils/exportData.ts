import { Table } from "@tanstack/react-table";
import { Workbook } from "exceljs";
import { ArrivingVesselsResponse } from "@/components/VesselTable";
import { api } from "@/lib/api";
import { ArrayElement } from "./type";

export const exportVesselScores = async (
  table: Table<ArrayElement<ArrivingVesselsResponse>>,
) => {
  const response = await api.score.headers.$get();
  if (!response.ok) {
    throw new Error("Failed to fetch vessels");
  }

  const headers = await response.json();

  const tableRows =
    table.getSelectedRowModel().rows.length > 0
      ? table.getSelectedRowModel().rows
      : table.getSortedRowModel().rows;

  const wb = new Workbook();
  const ws = wb.addWorksheet("Vessel Scores", {
    properties: {
      defaultColWidth: 15,
    },
  });
  ws.addConditionalFormatting({
    ref: "A1:Z1048576",
    rules: [
      {
        priority: 1,
        type: "expression",
        formulae: ['AND(ISNUMBER(SEARCH("MANUAL", A$1)), ISBLANK(A1))'],
        style: {
          fill: {
            type: "pattern",
            pattern: "solid",
            bgColor: { argb: "FFFFFF00" },
          },
        },
      },
    ],
  });
  const headerRow = ws.getRow(1);
  headerRow.values = headers;
  headerRow.commit();

  let rowNum = 2;
  tableRows.forEach((vesselInfoRow) => {
    const row = ws.getRow(rowNum);
    const vesselInfo = vesselInfoRow.original;

    row.getCell(1).value = vesselInfo.vesselArrivalDetails.imo;
    row.getCell(2).value = vesselInfo.vesselArrivalDetails.vesselName;
    let colNum = 3;
    vesselInfo.score.checkedRules.forEach((rule) => {
      if (rule.tripped) {
        row.getCell(colNum).value = rule.weight;
      }
      colNum += 1;
    });
    colNum += vesselInfo.score.manualRules.length;

    const sumStartCell = row.getCell(2).address;
    const sumEndCell = row.getCell(colNum - 1).address;
    const sumCell = row.getCell(colNum).address;
    row.getCell(colNum).value = {
      formula: `SUM(${sumStartCell}:${sumEndCell})`,
      result: vesselInfo.score.score,
    };
    row.getCell(colNum + 1).value = {
      formula: `IFS(${sumCell} >= 100, 2, ${sumCell} >= 70, 3, ${sumCell} >= 50, 4, ${sumCell} >= 30, 5)`,
      result: vesselInfo.score.level,
    };

    row.commit();
    rowNum += 1;
  });
  const lastCol = ws.getColumn(ws.columnCount).letter;
  ws.addConditionalFormatting({
    ref: `${lastCol}1:${lastCol}1048576`,
    rules: [
      {
        priority: 1,
        type: "cellIs",
        operator: "equal",
        formulae: [2],
        style: {
          fill: {
            type: "pattern",
            pattern: "solid",
            bgColor: { argb: "FFFED7AA" },
          },
        },
      },
      {
        priority: 1,
        type: "cellIs",
        operator: "equal",
        formulae: [3],
        style: {
          fill: {
            type: "pattern",
            pattern: "solid",
            bgColor: { argb: "FFFEF08A" },
          },
        },
      },
      {
        priority: 1,
        type: "cellIs",
        operator: "equal",
        formulae: [4],
        style: {
          fill: {
            type: "pattern",
            pattern: "solid",
            bgColor: { argb: "FFBFDBFE" },
          },
        },
      },
      {
        priority: 1,
        type: "cellIs",
        operator: "equal",
        formulae: [5],
        style: {
          fill: {
            type: "pattern",
            pattern: "solid",
            bgColor: { argb: "FFBBF7D0" },
          },
        },
      },
    ],
  });

  const buffer = await wb.xlsx.writeBuffer();
  return buffer;
};

export const downloadFile = ({
  data,
  dataType,
  filename,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  dataType: string;
  filename: string;
}) => {
  const blob = new Blob([data], { type: dataType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
