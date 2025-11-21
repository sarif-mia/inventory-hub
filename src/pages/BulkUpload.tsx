import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Download, FileText, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface UploadResult {
  successful: number;
  failed: number;
  errors: string[];
}

export default function BulkUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error("Please select a CSV file");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadResult(null);

    try {
      // Parse CSV
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        throw new Error("CSV file must have at least a header row and one data row");
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const requiredHeaders = ['name', 'sku', 'base_price'];

      // Validate headers
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
      }

      // Parse data rows
      const products: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length !== headers.length) continue;

        const product: any = {};
        headers.forEach((header, index) => {
          const value = values[index];
          if (header === 'base_price' || header === 'cost_price' || header === 'weight') {
            product[header] = value ? parseFloat(value) : null;
          } else if (header === 'category_id' || header === 'supplier_id') {
            product[header] = value ? parseInt(value) : null;
          } else {
            product[header] = value;
          }
        });
        products.push(product);
      }

      setUploadProgress(50);

      // Upload to backend
      const response = await fetch('/api/products/bulk-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ products }),
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      setUploadResult(result);
      setUploadProgress(100);

      if (result.successful > 0) {
        toast.success(`Successfully uploaded ${result.successful} products`);
      }
      if (result.failed > 0) {
        toast.error(`Failed to upload ${result.failed} products`);
      }

    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
      setUploadResult(null);
    } finally {
      setIsUploading(false);
    }
  };

  const downloadSampleCSV = () => {
    const csvContent = `name,sku,base_price,description,cost_price,weight,category_id,supplier_id
Wireless Headphones,WH-001,99.99,High-quality wireless headphones,75.00,0.5,1,1
Bluetooth Speaker,BS-002,49.99,Portable Bluetooth speaker,35.00,0.3,1,2
USB Cable,USB-003,9.99,1m USB charging cable,5.00,0.1,2,1`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_products.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Bulk Upload</h1>
        <p className="text-muted-foreground mt-1">Import multiple products at once</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>CSV Upload</CardTitle>
          <CardDescription>Upload a CSV file to import products in bulk</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${dragActive ? 'border-primary bg-primary/5' : 'border-border'
              }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              {isUploading ? "Uploading..." : "Drag and drop your CSV file here, or click to browse"}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <FileText className="h-4 w-4 mr-2" />
              Choose File
            </Button>
          </div>

          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          <div className="space-y-4">
            <h3 className="font-semibold">CSV Format Requirements:</h3>
            <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
              <li>Required columns: name, sku, base_price</li>
              <li>Optional columns: description, cost_price, weight, category_id, supplier_id</li>
              <li>First row should contain column headers</li>
              <li>Use comma (,) as delimiter</li>
              <li>SKUs must be unique</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={downloadSampleCSV} className="gap-2">
              <Download className="h-4 w-4" />
              Download Sample CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {uploadResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {uploadResult.failed === 0 ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : uploadResult.successful === 0 ? (
                <XCircle className="h-5 w-5 text-red-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              )}
              Upload Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Badge variant="default" className="bg-green-600">
                {uploadResult.successful} Successful
              </Badge>
              {uploadResult.failed > 0 && (
                <Badge variant="destructive">
                  {uploadResult.failed} Failed
                </Badge>
              )}
            </div>

            {uploadResult.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Errors:</h4>
                <ul className="text-sm text-red-600 space-y-1 max-h-40 overflow-y-auto">
                  {uploadResult.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Upload History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Upload history will be available here
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
