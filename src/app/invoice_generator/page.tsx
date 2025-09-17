'use client';
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Download, Save, Plus, Trash2 } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { toast } from 'react-toastify';
import { PDFDownloadLink } from '@react-pdf/renderer';
import InvoicePDF from './InvoicePDF';
import { supabase } from "@/lib/supabaseClient";
import { useInvoiceActions } from "@/lib/useInvoiceActions";
import { useRouter } from 'next/navigation';




interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface InvoiceData {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  fromCompany: string;
  fromAddress: string;
  fromEmail: string;
  fromPhone: string;
  toCompany: string;
  toAddress: string;
  toEmail: string;
  items: InvoiceItem[];
  notes: string;
  taxRate: number;
}

export default function InvoiceGenerator() {
  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    fromCompany: "",
    fromAddress: "",
    fromEmail: "",
    fromPhone: "",
    toCompany: "",
    toAddress: "",
    toEmail: "",
    items: [{ id: "1", description: "", quantity: 1, rate: 0, amount: 0 }],
    notes: "",
    taxRate: 0,
  });
  const router = useRouter();
  const { saveInvoiceToDB } = useInvoiceActions(invoiceData);

  useEffect(() => {
    let isMounted = true;
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (!isMounted) return;
      if (error) {
        toast.error("You have to login first");
        router.push('/login');
      } else {
        console.log("User ID:", user?.id);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const updateInvoiceData = (field: keyof InvoiceData, value: string | number | InvoiceItem[]) => {
    setInvoiceData((prev) => ({ ...prev, [field]: value }));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setInvoiceData((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          if (field === "quantity" || field === "rate") {
            updatedItem.amount = updatedItem.quantity * updatedItem.rate;
          }
          return updatedItem;
        }
        return item;
      }),
    }));
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: "",
      quantity: 1,
      rate: 0,
      amount: 0,
    };
    setInvoiceData((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const removeItem = (id: string) => {
    setInvoiceData((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }));
  };

  const subtotal = invoiceData.items.reduce(
    (sum, item) => sum + item.amount,
    0,
  );
  const taxAmount = subtotal * (invoiceData.taxRate / 100);
  const total = subtotal + taxAmount;


  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Create New Invoice
            </h1>
            <p className="text-gray-600">
              {`Fill in the details below to generate your professional invoice`}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form Section */}
            <div className="space-y-6">
              {/* Invoice Header */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Invoice Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="invoiceNumber">Invoice Number</Label>
                    <Input
                      id="invoiceNumber"
                      value={invoiceData.invoiceNumber}
                      onChange={(e) =>
                        updateInvoiceData("invoiceNumber", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="date">Invoice Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={invoiceData.date}
                      onChange={(e) => updateInvoiceData("date", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={invoiceData.dueDate}
                      onChange={(e) =>
                        updateInvoiceData("dueDate", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* From Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  From (Your Details)
                </h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="fromCompany">Company Name</Label>
                    <Input
                      id="fromCompany"
                      value={invoiceData.fromCompany}
                      onChange={(e) =>
                        updateInvoiceData("fromCompany", e.target.value)
                      }
                      className="mt-1"
                      placeholder="Your Company Name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="fromAddress">Address</Label>
                    <Textarea
                      id="fromAddress"
                      value={invoiceData.fromAddress}
                      onChange={(e) =>
                        updateInvoiceData("fromAddress", e.target.value)
                      }
                      className="mt-1"
                      placeholder="Your business address"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fromEmail">Email</Label>
                      <Input
                        id="fromEmail"
                        type="email"
                        value={invoiceData.fromEmail}
                        onChange={(e) =>
                          updateInvoiceData("fromEmail", e.target.value)
                        }
                        className="mt-1"
                        placeholder="your@email.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="fromPhone">Phone</Label>
                      <Input
                        id="fromPhone"
                        value={invoiceData.fromPhone}
                        onChange={(e) =>
                          updateInvoiceData("fromPhone", e.target.value)
                        }
                        className="mt-1"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* To Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Bill To (Client Details)
                </h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="toCompany">Client Company</Label>
                    <Input
                      id="toCompany"
                      value={invoiceData.toCompany}
                      onChange={(e) =>
                        updateInvoiceData("toCompany", e.target.value)
                      }
                      className="mt-1"
                      placeholder="Client Company Name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="toAddress">Client Address</Label>
                    <Textarea
                      id="toAddress"
                      value={invoiceData.toAddress}
                      onChange={(e) =>
                        updateInvoiceData("toAddress", e.target.value)
                      }
                      className="mt-1"
                      placeholder="Client address"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="toEmail">Client Email</Label>
                    <Input
                      id="toEmail"
                      type="email"
                      value={invoiceData.toEmail}
                      onChange={(e) =>
                        updateInvoiceData("toEmail", e.target.value)
                      }
                      className="mt-1"
                      placeholder="client@email.com"
                    />
                  </div>
                </div>
              </div>

              {/* Items Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Invoice Items
                  </h2>
                  <Button
                    onClick={addItem}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>

                <div className="space-y-4">
                  {invoiceData.items.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-12 gap-2 items-end"
                    >
                      <div className="col-span-5">
                        <Label htmlFor={`desc-${item.id}`}>Description</Label>
                        <Input
                          id={`desc-${item.id}`}
                          value={item.description}
                          onChange={(e) =>
                            updateItem(item.id, "description", e.target.value)
                          }
                          placeholder="Service or product description"
                          className="mt-1"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor={`qty-${item.id}`}>Qty</Label>
                        <Input
                          id={`qty-${item.id}`}
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(
                              item.id,
                              "quantity",
                              parseFloat(e.target.value) || 1,
                            )
                          }
                          className="mt-1"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor={`rate-${item.id}`}>Rate</Label>
                        <Input
                          id={`rate-${item.id}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.rate}
                          onChange={(e) =>
                            updateItem(
                              item.id,
                              "rate",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="mt-1"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Amount</Label>
                        <div className="mt-1 py-2 text-right font-medium">
                          ${item.amount.toFixed(2)}
                        </div>
                      </div>
                      <div className="col-span-1">
                        {invoiceData.items.length > 1 && (
                          <Button
                            onClick={() => removeItem(item.id)}
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 border-t pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="taxRate">Tax Rate (%)</Label>
                      <Input
                        id="taxRate"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={invoiceData.taxRate}
                        onChange={(e) =>
                          updateInvoiceData(
                            "taxRate",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        className="mt-1"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span className="font-medium">
                          ${subtotal.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax:</span>
                        <span className="font-medium">
                          ${taxAmount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-lg font-bold border-t pt-2">
                        <span>Total:</span>
                        <span>${total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Additional Notes
                </h2>
                <Textarea
                  value={invoiceData.notes}
                  onChange={(e) => updateInvoiceData("notes", e.target.value)}
                  placeholder="Payment terms, thank you message, or other notes..."
                  rows={4}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={() => saveInvoiceToDB("draft")}
                  size="lg"
                  variant="outline"
                  className="flex-1"
                >
                  <Save className="h-5 w-5 mr-2" />
                  Save Invoice
                </Button>
                <Button
                  onClick={() => saveInvoiceToDB("final")}
                  size="lg"
                  variant="outline"
                  className="flex-1"
                >
                  <Save className="h-5 w-5 mr-2" />
                  final
                </Button>
                <PDFDownloadLink
                  document={
                    <InvoicePDF
                      invoiceData={invoiceData}
                      subtotal={subtotal}
                      taxAmount={taxAmount}
                      total={total}
                    />
                  }
                  fileName={`invoice-${invoiceData.invoiceNumber}.pdf`}
                >
                  {({ loading }) => (
                    <Button
                      size="lg"
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      disabled={loading}

                    >
                      <Download className="h-5 w-5 mr-2" />
                      {loading ? 'Generating PDF...' : 'Generate PDF'}
                    </Button>
                  )}
                </PDFDownloadLink>
              </div>
            </div>

            {/* Preview Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Invoice Preview
              </h2>

              <div className="space-y-6">
                {/* Header */}
                <div className="text-center pb-6 border-b">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    INVOICE
                  </h1>
                  <p className="text-gray-600">#{invoiceData.invoiceNumber}</p>
                </div>

                {/* Dates and Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Invoice Date:</p>
                    <p className="font-medium">{invoiceData.date}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Due Date:</p>
                    <p className="font-medium">{invoiceData.dueDate}</p>
                  </div>
                </div>

                {/* From/To */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">From:</h3>
                    <div className="text-sm text-gray-600">
                      <p className="font-medium">
                        {invoiceData.fromCompany || "Your Company"}
                      </p>
                      <p className="whitespace-pre-line">
                        {invoiceData.fromAddress}
                      </p>
                      <p>{invoiceData.fromEmail}</p>
                      <p>{invoiceData.fromPhone}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Bill To:</h3>
                    <div className="text-sm text-gray-600">
                      <p className="font-medium">
                        {invoiceData.toCompany || "Client Company"}
                      </p>
                      <p className="whitespace-pre-line">
                        {invoiceData.toAddress}
                      </p>
                      <p>{invoiceData.toEmail}</p>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-sm font-medium text-gray-900 border-b pb-2">
                    <div className="col-span-6">Description</div>
                    <div className="col-span-2 text-center">Qty</div>
                    <div className="col-span-2 text-right">Rate</div>
                    <div className="col-span-2 text-right">Amount</div>
                  </div>
                  {invoiceData.items.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-12 gap-2 text-sm py-2 border-b border-gray-100"
                    >
                      <div className="col-span-6">
                        {item.description || "Service description"}
                      </div>
                      <div className="col-span-2 text-center">
                        {item.quantity}
                      </div>
                      <div className="col-span-2 text-right">
                        ${item.rate.toFixed(2)}
                      </div>
                      <div className="col-span-2 text-right font-medium">
                        ${item.amount.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax ({invoiceData.taxRate}%):</span>
                    <span>${taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Notes */}
                {invoiceData.notes && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Notes:</h4>
                    <p className="text-sm text-gray-600 whitespace-pre-line">
                      {invoiceData.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

    </ProtectedRoute>
  );
}
