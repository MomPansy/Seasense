import { Workbook } from "exceljs";
import { ArrivingVesselsResponse } from "@/components/VesselTable";
import { api } from "@/lib/api";

export const exportVesselScores = async (
  filteredVessels: ArrivingVesselsResponse,
) => {
  const response = await api.score.headers.$get();
  if (!response.ok) {
    throw new Error("Failed to fetch vessels");
  }
  const headers = await response.json();

  const wb = new Workbook();
  const ws = wb.addWorksheet("Vessel Scores");
  ws.addConditionalFormatting({
    ref: "A1:Z1048576",
    rules: [
      {
        priority: 1,
        type: "expression",
        formulae: ['ISNUMBER(SEARCH("MANUAL", A$1))'],
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
  filteredVessels.forEach((vesselInfo) => {
    const row = ws.getRow(rowNum);

    row.getCell(1).value = vesselInfo.vesselArrivalDetails.vesselName;
    let colNum = 2;
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
