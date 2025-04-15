import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const EtabsBeamOptimizer = () => {
  const [etabsFileName, setEtabsFileName] = useState(null);
  const [beamData, setBeamData] = useState([]);
  const [optimizationResults, setOptimizationResults] = useState([]);
  const [costSummary, setCostSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleLoadModel = () => {
    setEtabsFileName("ExampleModel.edb");
    const beams = extractMockData();
    setBeamData(beams);
    setOptimizationResults([]);
    setCostSummary(null);
    setShowResults(false);
  };

  const handleRunOptimization = () => {
    if (beamData.length === 0) return alert("Please load model first.");
    setLoading(true);
    setTimeout(() => {
      const { results, summary } = runMockOptimization(beamData, mockBeamLibrary);
      setOptimizationResults(results);
      setCostSummary(summary);
      setLoading(false);
      setShowResults(true);
    }, 1500);
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex gap-2">
        <Button onClick={handleLoadModel}>Load ETABS Model</Button>
        <Button onClick={handleRunOptimization} disabled={loading}>{loading ? "Optimizing..." : "Run Optimization"}</Button>
      </div>

      {etabsFileName && (
        <p className="text-sm text-muted-foreground">Loaded: {etabsFileName}</p>
      )}

      {showResults && (
        <>
          <Card>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Original</TableHead>
                    <TableHead>Optimized</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cost/m (Original)</TableHead>
                    <TableHead>Cost/m (Optimized)</TableHead>
                    <TableHead>Span (m)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {optimizationResults.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.id}</TableCell>
                      <TableCell>{row.originalSection}</TableCell>
                      <TableCell>{row.optimizedSection}</TableCell>
                      <TableCell>{row.status}</TableCell>
                      <TableCell>{row.originalCostPerMeter}</TableCell>
                      <TableCell>{row.optimizedCostPerMeter}</TableCell>
                      <TableCell>{row.span}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {costSummary && (
            <Card>
              <CardContent className="text-sm space-y-1 p-4">
                <p>Total Original Cost: Rs. {costSummary.totalOriginalCost}</p>
                <p>Total Optimized Cost: Rs. {costSummary.totalOptimizedCost}</p>
                <p>Savings: Rs. {costSummary.savings} ({costSummary.savingsPercent}%)</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default EtabsBeamOptimizer;

// Helper logic (should be moved to a utils folder or service)
const mockBeamLibrary = [
  { section: 'I-150', x: 150, y: 75, maxMoment: 60, cost: 50 },
  { section: 'I-200', x: 200, y: 100, maxMoment: 100, cost: 65 },
  { section: 'I-250', x: 250, y: 125, maxMoment: 150, cost: 80 },
  { section: 'I-300', x: 300, y: 150, maxMoment: 220, cost: 100 },
  { section: 'I-350', x: 350, y: 175, maxMoment: 300, cost: 125 },
];

const calculateMoment = (load, span) => parseFloat(((load * span * span) / 8).toFixed(2));

const extractMockData = () => {
  const beams = [
    { id: 'B1', story: 1, span: 6, load: 25, originalSection: 'I-250' },
    { id: 'B2', story: 1, span: 8, load: 30, originalSection: 'I-350' },
    { id: 'B3', story: 2, span: 5, load: 20, originalSection: 'I-200' },
    { id: 'B4', story: 2, span: 7, load: 28, originalSection: 'I-300' },
    { id: 'B5', story: 3, span: 6, load: 22, originalSection: 'I-300' },
  ];
  return beams.map(beam => ({ ...beam, calculatedMoment: calculateMoment(beam.load, beam.span) }));
};

const runMockOptimization = (extractedData, library) => {
  const results = [];
  let totalOriginalCost = 0;
  let totalOptimizedCost = 0;

  const libraryMap = new Map(library.map(item => [item.section, item]));

  extractedData.forEach(beam => {
    const originalSectionInfo = libraryMap.get(beam.originalSection);
    if (!originalSectionInfo) {
      results.push({ ...beam, originalCostPerMeter: 0, optimizedSection: beam.originalSection, optimizedCostPerMeter: 0, status: '❌ Error' });
      return;
    }

    const originalCost = originalSectionInfo.cost * beam.span;
    totalOriginalCost += originalCost;

    const alternatives = library
      .filter(lib => lib.maxMoment >= beam.calculatedMoment && lib.cost < originalSectionInfo.cost)
      .sort((a, b) => a.cost - b.cost);

    if (alternatives.length > 0) {
      const best = alternatives[0];
      const optimizedCost = best.cost * beam.span;
      totalOptimizedCost += optimizedCost;
      results.push({
        id: beam.id,
        originalSection: beam.originalSection,
        originalCostPerMeter: originalSectionInfo.cost,
        optimizedSection: best.section,
        optimizedCostPerMeter: best.cost,
        span: beam.span,
        status: '✅ Replaced'
      });
    } else {
      totalOptimizedCost += originalCost;
      results.push({
        id: beam.id,
        originalSection: beam.originalSection,
        originalCostPerMeter: originalSectionInfo.cost,
        optimizedSection: beam.originalSection,
        optimizedCostPerMeter: originalSectionInfo.cost,
        span: beam.span,
        status: '⚠️ Unchanged'
      });
    }
  });

  const savings = totalOriginalCost - totalOptimizedCost;
  const savingsPercent = totalOriginalCost > 0 ? parseFloat(((savings / totalOriginalCost) * 100).toFixed(1)) : 0;

  return {
    results,
    summary: {
      totalOriginalCost: parseFloat(totalOriginalCost.toFixed(2)),
      totalOptimizedCost: parseFloat(totalOptimizedCost.toFixed(2)),
      savings: parseFloat(savings.toFixed(2)),
      savingsPercent
    }
  };
};
