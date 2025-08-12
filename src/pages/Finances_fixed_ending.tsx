// Fixed ending for Finances component
// This shows the correct JSX structure that should be at the end

const correctEnding = `
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

export default correctEnding
