#!/usr/bin/env node

/**
 * Simple Test Runner for Building Management System
 * Run with: node test-runner.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import net from 'net';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TestRunner {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            tests: []
        };
    }

    async runTest(testName, testFunction) {
        this.results.total++;
        console.log(`\n🧪 Running: ${testName}`);
        
        try {
            await testFunction();
            this.results.passed++;
            this.results.tests.push({
                name: testName,
                status: 'PASSED',
                timestamp: new Date().toISOString()
            });
            console.log(`✅ PASSED: ${testName}`);
        } catch (error) {
            this.results.failed++;
            this.results.tests.push({
                name: testName,
                status: 'FAILED',
                error: error.message,
                timestamp: new Date().toISOString()
            });
            console.log(`❌ FAILED: ${testName}`);
            console.log(`   Error: ${error.message}`);
        }
    }

    async runConnectivityTests() {
        console.log('\n🔌 Running Connectivity Tests...');
        
        await this.runTest('Check if app is running on localhost:3003', async () => {
            return new Promise((resolve, reject) => {
                const client = new net.Socket();
                client.connect(3003, 'localhost', () => {
                    client.destroy();
                    resolve();
                });
                client.on('error', () => {
                    reject(new Error('App not running on localhost:3003'));
                });
                setTimeout(() => {
                    client.destroy();
                    reject(new Error('Connection timeout'));
                }, 5000);
            });
        });

        await this.runTest('Check Firebase configuration exists', async () => {
            const configPath = path.join(__dirname, 'src', 'firebase', 'config.ts');
            if (!fs.existsSync(configPath)) {
                throw new Error('Firebase config file not found');
            }
        });

        await this.runTest('Check package.json exists', async () => {
            const packagePath = path.join(__dirname, 'package.json');
            if (!fs.existsSync(packagePath)) {
                throw new Error('package.json not found');
            }
        });

        await this.runTest('Check firestore.rules exists', async () => {
            const rulesPath = path.join(__dirname, 'firestore.rules');
            if (!fs.existsSync(rulesPath)) {
                throw new Error('firestore.rules not found');
            }
        });
    }

    async runFileStructureTests() {
        console.log('\n📁 Running File Structure Tests...');
        
        const requiredFiles = [
            'src/App.tsx',
            'src/main.tsx',
            'src/pages/Dashboard.tsx',
            'src/pages/Tickets.tsx',
            'src/pages/CreateTicket.tsx',
            'src/pages/Suppliers.tsx',
            'src/pages/Events.tsx',
            'src/pages/Login.tsx',
            'src/components/Layout/Header.tsx',
            'src/components/Layout/Sidebar.tsx',
            'src/services/ticketService.ts',
            'src/services/supplierService.ts',
            'src/contexts/AuthContext.tsx',
            'vite.config.ts',
            'tailwind.config.js',
            'tsconfig.json'
        ];

        for (const file of requiredFiles) {
            await this.runTest(`Check ${file} exists`, async () => {
                const filePath = path.join(__dirname, file);
                if (!fs.existsSync(filePath)) {
                    throw new Error(`${file} not found`);
                }
            });
        }
    }

    async runDependencyTests() {
        console.log('\n📦 Running Dependency Tests...');
        
        await this.runTest('Check package.json has required dependencies', async () => {
            const packagePath = path.join(__dirname, 'package.json');
            const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
            
            const requiredDeps = [
                'react', 'react-dom', 'firebase', 'react-router-dom',
                'tailwindcss', 'vite', '@types/react', '@types/react-dom'
            ];
            
            const missingDeps = requiredDeps.filter(dep => 
                !packageJson.dependencies[dep] && !packageJson.devDependencies[dep]
            );
            
            if (missingDeps.length > 0) {
                throw new Error(`Missing dependencies: ${missingDeps.join(', ')}`);
            }
        });

        await this.runTest('Check node_modules exists', async () => {
            const nodeModulesPath = path.join(__dirname, 'node_modules');
            if (!fs.existsSync(nodeModulesPath)) {
                throw new Error('node_modules not found - run npm install');
            }
        });
    }

    async runTypeScriptTests() {
        console.log('\n🔧 Running TypeScript Tests...');
        
        await this.runTest('Check TypeScript compilation', async () => {
            return new Promise((resolve, reject) => {
                exec('npx tsc --noEmit', (error, stdout, stderr) => {
                    if (error) {
                        reject(new Error(`TypeScript compilation failed: ${stderr}`));
                    } else {
                        resolve();
                    }
                });
            });
        });
    }

    generateReport() {
        console.log('\n📊 Test Results Summary');
        console.log('='.repeat(50));
        console.log(`Total Tests: ${this.results.total}`);
        console.log(`Passed: ${this.results.passed} ✅`);
        console.log(`Failed: ${this.results.failed} ❌`);
        console.log(`Skipped: ${this.results.skipped} ⏭️`);
        console.log(`Success Rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);
        
        if (this.results.failed > 0) {
            console.log('\n❌ Failed Tests:');
            this.results.tests
                .filter(test => test.status === 'FAILED')
                .forEach(test => {
                    console.log(`   - ${test.name}: ${test.error}`);
                });
        }

        // Save results to file
        const reportPath = path.join(__dirname, 'test-results.json');
        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
        console.log(`\n📄 Detailed results saved to: ${reportPath}`);

        // Update test log in TEST_CASES.md
        this.updateTestLog();
    }

    updateTestLog() {
        const testCasesPath = path.join(__dirname, 'TEST_CASES.md');
        if (!fs.existsSync(testCasesPath)) {
            console.log('TEST_CASES.md not found, skipping log update');
            return;
        }

        const content = fs.readFileSync(testCasesPath, 'utf8');
        const testRunEntry = `
### Test Run #${Math.floor(Date.now() / 1000000)} - [Date: ${new Date().toLocaleDateString()}]
**Tester**: Automated Test Runner  
**Environment**: Local Development  
**Results**:
- Total Tests: ${this.results.total}
- Passed: ${this.results.passed}
- Failed: ${this.results.failed}
- Skipped: ${this.results.skipped}

**Notes**: Automated test run - ${this.results.failed > 0 ? 'Some tests failed' : 'All tests passed'}

`;

        // Find the Test Execution Log section and add the new entry
        const logSectionIndex = content.indexOf('## Test Execution Log');
        if (logSectionIndex !== -1) {
            const beforeLog = content.substring(0, logSectionIndex);
            const afterLog = content.substring(logSectionIndex);
            const updatedContent = beforeLog + '## Test Execution Log' + testRunEntry + afterLog.substring(afterLog.indexOf('\n\n'));
            
            fs.writeFileSync(testCasesPath, updatedContent);
            console.log('📝 Test log updated in TEST_CASES.md');
        }
    }

    async runAllTests() {
        console.log('🚀 Starting Building Management System Test Suite');
        console.log('='.repeat(60));
        
        await this.runConnectivityTests();
        await this.runFileStructureTests();
        await this.runDependencyTests();
        await this.runTypeScriptTests();
        
        this.generateReport();
        
        console.log('\n🎉 Test suite completed!');
        process.exit(this.results.failed > 0 ? 1 : 0);
    }
}

// Run the test suite
const runner = new TestRunner();
runner.runAllTests().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
}); 