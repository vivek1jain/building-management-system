// This is a backup of the working Finances component structure
// Will be used to restore the correct JSX structure

const FinancesComponentEnd = `
        {/* Demand Details Modal */}
        {showDemandDetails && selectedDemand && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 font-inter">
                  Service Charge Demand Details
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900 font-inter">Property Details</h4>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 font-inter">
                        <strong>Flat Number:</strong> {selectedDemand.flat}
                      </p>
                      <p className="text-sm text-gray-600 font-inter">
                        <strong>Resident:</strong> {selectedDemand.resident}
                      </p>
                      <p className="text-sm text-gray-600 font-inter">
                        <strong>Quarter:</strong> {selectedQuarter}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900 font-inter">Payment Details</h4>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 font-inter">
                        <strong>Amount Due:</strong> {formatCurrency(selectedDemand.amount)}
                      </p>
                      <p className="text-sm text-gray-600 font-inter">
                        <strong>Due Date:</strong> {new Date(selectedDemand.dueDate).toLocaleDateString('en-GB')}
                      </p>
                      <p className="text-sm text-gray-600 font-inter">
                        <strong>Status:</strong> 
                        <span className={\`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full font-inter \${
                          selectedDemand.status === 'Paid' 
                            ? 'bg-green-100 text-green-800'
                            : selectedDemand.status === 'Partial'
                            ? 'bg-yellow-100 text-yellow-800'
                            : selectedDemand.overdue
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }\`}>
                          {selectedDemand.status === 'Outstanding' && selectedDemand.overdue ? 'Overdue' : selectedDemand.status}
                        </span>
                      </p>
                      {selectedDemand.status === 'Partial' && (
                        <p className="text-sm text-gray-600 font-inter">
                          <strong>Amount Paid:</strong> {formatCurrency(selectedDemand.paidAmount || 0)}
                        </p>
                      )}
                      {selectedDemand.paidDate && (
                        <p className="text-sm text-gray-600 font-inter">
                          <strong>Paid Date:</strong> {new Date(selectedDemand.paidDate).toLocaleDateString('en-GB')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2 font-inter">Service Charge Breakdown</h4>
                  <div className="space-y-1 text-sm text-gray-600 font-inter">
                    <div className="flex justify-between">
                      <span>Building Maintenance:</span>
                      <span>{formatCurrency(selectedDemand.amount * 0.4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Insurance:</span>
                      <span>{formatCurrency(selectedDemand.amount * 0.2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Management Fee:</span>
                      <span>{formatCurrency(selectedDemand.amount * 0.15)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Reserve Fund:</span>
                      <span>{formatCurrency(selectedDemand.amount * 0.15)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Utilities:</span>
                      <span>{formatCurrency(selectedDemand.amount * 0.1)}</span>
                    </div>
                    <div className="border-t border-gray-300 pt-1 mt-2">
                      <div className="flex justify-between font-medium">
                        <span>Total:</span>
                        <span>{formatCurrency(selectedDemand.amount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowDemandDetails(false)
                      setSelectedDemand(null)
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-inter"
                  >
                    Close
                  </button>
                  {selectedDemand.status !== 'Paid' && (
                    <button
                      onClick={() => {
                        setShowDemandDetails(false)
                        handleRecordPayment(selectedDemand)
                      }}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors font-inter"
                    >
                      Record Payment
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Finances
`

export default FinancesComponentEnd
