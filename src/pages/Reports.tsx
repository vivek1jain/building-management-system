import React from 'react';
import { BarChart3, FileText, TrendingUp, PieChart } from 'lucide-react';

const Reports: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 font-inter">Financial Reports</h1>
            <p className="text-gray-600 font-inter">Generate and view comprehensive financial reports for your buildings</p>
          </div>
        </div>

        {/* Report Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Budget Reports */}
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                <BarChart3 className="h-8 w-8 text-primary-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-neutral-900 font-inter">Budget Reports</h3>
                <p className="text-sm text-gray-600 font-inter">Budget vs. actual analysis and variance reports</p>
              </div>
            </div>
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 rounded-md font-inter">
                Budget vs. Actual Report
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 rounded-md font-inter">
                Budget Variance Analysis
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 rounded-md font-inter">
                Quarterly Budget Summary
              </button>
            </div>
          </div>

          {/* Financial Statements */}
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-success-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-neutral-900 font-inter">Financial Statements</h3>
                <p className="text-sm text-gray-600 font-inter">Income statements and cash flow reports</p>
              </div>
            </div>
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 rounded-md font-inter">
                Income Statement
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 rounded-md font-inter">
                Cash Flow Statement
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 rounded-md font-inter">
                Balance Sheet Summary
              </button>
            </div>
          </div>

          {/* Service Charge Reports */}
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-neutral-900 font-inter">Service Charge Reports</h3>
                <p className="text-sm text-gray-600 font-inter">Collection reports and outstanding analysis</p>
              </div>
            </div>
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 rounded-md font-inter">
                Collection Summary
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 rounded-md font-inter">
                Outstanding Charges Report
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 rounded-md font-inter">
                Payment History Report
              </button>
            </div>
          </div>

          {/* Expense Analysis */}
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                <PieChart className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-neutral-900 font-inter">Expense Analysis</h3>
                <p className="text-sm text-gray-600 font-inter">Expense breakdowns and trend analysis</p>
              </div>
            </div>
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 rounded-md font-inter">
                Expense Category Breakdown
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 rounded-md font-inter">
                Monthly Expense Trends
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 rounded-md font-inter">
                Supplier Expense Analysis
              </button>
            </div>
          </div>

          {/* Custom Reports */}
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-neutral-900 font-inter">Custom Reports</h3>
                <p className="text-sm text-gray-600 font-inter">Build custom reports with flexible parameters</p>
              </div>
            </div>
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 rounded-md font-inter">
                Report Builder
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 rounded-md font-inter">
                Saved Reports
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 rounded-md font-inter">
                Scheduled Reports
              </button>
            </div>
          </div>

          {/* Year-end Reports */}
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-neutral-900 font-inter">Year-end Reports</h3>
                <p className="text-sm text-gray-600 font-inter">Annual summaries and compliance reports</p>
              </div>
            </div>
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 rounded-md font-inter">
                Annual Financial Summary
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 rounded-md font-inter">
                Tax Reporting Summary
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 rounded-md font-inter">
                Audit Trail Report
              </button>
            </div>
          </div>
        </div>

        {/* Coming Soon Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <BarChart3 className="h-5 w-5 text-primary-600 mt-0.5" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-primary-900 font-inter">Enhanced Reporting Coming Soon</h3>
              <div className="mt-2 text-sm text-primary-700 font-inter">
                <p className="mb-2">
                  We're working on bringing you comprehensive financial reporting capabilities including:
                </p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Interactive charts and visualizations</li>
                  <li>Export to PDF and Excel formats</li>
                  <li>Automated report scheduling</li>
                  <li>Custom report templates</li>
                  <li>Comparative analysis tools</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
