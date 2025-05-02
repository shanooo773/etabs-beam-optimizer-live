import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const EtabsBeamOptimizer = () => {
  const [frames, setFrames] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // You can load beam library or any other static data here if needed
  }, []);

  const handleLoadModel = () => {
    setLoading(true);
    fetch('http://localhost:5000/optimize')
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setFrames(data.frames || []);
          setError(null);
          alert(`Model loaded. Beams found: ${data.frames?.length || 0}`);
        }
        setLoading(false);
      })
      .catch(err => {
        setError(`Connection error: ${err.message}`);
        setLoading(false);
      });
  };

  const handleRunOptimization = () => {
    if (!frames.length) {
      alert('Please load ETABS model first.');
      return;
    }

    setLoading(true);
    fetch('http://localhost:5000/optimize')
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          const sug = data.suggestion || [];
          setSuggestions(sug);
          setError(null);
        }
        setLoading(false);
      })
      .catch(err => {
        setError(`Optimization failed: ${err.message}`);
        setLoading(false);
      });
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex gap-2">
        <Button onClick={handleLoadModel} disabled={loading}>
          {loading ? 'Loading...' : 'Load ETABS Model'}
        </Button>
        <Button onClick={handleRunOptimization} disabled={loading}>
          {loading ? 'Processing...' : 'Run Optimization'}
        </Button>
      </div>

      {error && <p className="text-red-500">{error}</p>}

      {suggestions.length > 0 && (
        <Card>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Frame</TableHead>
                  <TableHead>Before Section</TableHead>
                  <TableHead>After Section</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Length (m)</TableHead>
                  <TableHead>Moment Req</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suggestions.map((row, idx) => {
                  const frame = frames.find(f => f.name === row.frame) || {};
                  const status = row.suggested_section !== frame.section ? 'Improvement' : 'Optimal';

                  return (
                    <TableRow key={idx}>
                      <TableCell>{row.frame}</TableCell>
                      <TableCell>{frame.section}</TableCell>
                      <TableCell>{row.suggested_section}</TableCell>
                      <TableCell>{status}</TableCell>
                      <TableCell>{(frame.length || 0).toFixed(2)}</TableCell>
                      <TableCell>{row.moment_required}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {suggestions.length === 0 && !loading && (
        <p>No optimizations needed; current sections are optimal.</p>
      )}
    </div>
  );
};

export default EtabsBeamOptimizer;
