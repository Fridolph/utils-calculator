// scripts/generate-coverage-badge.js
const fs = require('fs')
const path = require('path')

// 读取覆盖率报告
function readCoverageReport() {
  try {
    // 尝试读取 lcov 报告
    const lcovPath = path.join(__dirname, '..', 'coverage', 'lcov-report', 'index.html')
    const summaryPath = path.join(__dirname, '..', 'coverage', 'coverage-summary.json')
    const lcovInfoPath = path.join(__dirname, '..', 'coverage', 'lcov.info')
    const mainTsHtmlPath = path.join(
      __dirname,
      '..',
      'coverage',
      'lcov-report',
      'main.ts.html'
    )

    if (fs.existsSync(summaryPath)) {
      // 从 coverage-summary.json 读取数据
      const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'))
      return extractFromSummary(summary)
    } else if (fs.existsSync(lcovInfoPath)) {
      // 从 lcov.info 解析数据（优先使用 lcov.info，因为它包含最准确的数据）
      const lcovData = fs.readFileSync(lcovInfoPath, 'utf8')
      return extractFromLcov(lcovData)
    } else if (fs.existsSync(mainTsHtmlPath)) {
      // 从 main.ts.html 解析数据
      const html = fs.readFileSync(mainTsHtmlPath, 'utf8')
      return extractFromMainTsHTML(html)
    } else if (fs.existsSync(lcovPath)) {
      // 从 index.html 解析数据
      const html = fs.readFileSync(lcovPath, 'utf8')
      return extractFromHTML(html)
    } else {
      console.log('Coverage report not found')
      console.log('Please run "pnpm run coverage" first')
      return null
    }
  } catch (error) {
    console.error('Error reading coverage report:', error.message)
    return null
  }
}

function extractFromSummary(summary) {
  // 查找 main.ts 文件的覆盖率数据
  const mainFile = Object.keys(summary).find((file) => file.endsWith('main.ts'))
  if (mainFile) {
    const data = summary[mainFile]
    return {
      statements: data.statements.pct,
      branches: data.branches.pct,
      functions: data.functions.pct,
      lines: data.lines.pct,
    }
  }

  // 如果找不到 main.ts，使用第一个文件的数据
  const firstFile = Object.keys(summary)[0]
  if (firstFile) {
    const data = summary[firstFile]
    return {
      statements: data.statements.pct,
      branches: data.branches.pct,
      functions: data.functions.pct,
      lines: data.lines.pct,
    }
  }

  return null
}

function extractFromMainTsHTML(html) {
  try {
    // 从 main.ts.html 提取具体的覆盖率数据
    // 使用更准确的正则表达式匹配 HTML 报告中的数据
    const statementsMatch = html.match(/Statements\s*<\/span>\s*<span[^>]*>([\d.]+)%/)
    const branchesMatch = html.match(/Branches\s*<\/span>\s*<span[^>]*>([\d.]+)%/)
    const functionsMatch = html.match(/Functions\s*<\/span>\s*<span[^>]*>([\d.]+)%/)
    const linesMatch = html.match(/Lines\s*<\/span>\s*<span[^>]*>([\d.]+)%/)

    if (statementsMatch && branchesMatch && functionsMatch && linesMatch) {
      return {
        statements: parseFloat(statementsMatch[1]),
        branches: parseFloat(branchesMatch[1]),
        functions: parseFloat(functionsMatch[1]),
        lines: parseFloat(linesMatch[1]),
      }
    }

    // 尝试另一种格式
    const statementsMatch2 = html.match(/([\d.]+)%\s*Statements/)
    const branchesMatch2 = html.match(/([\d.]+)%\s*Branches/)
    const functionsMatch2 = html.match(/([\d.]+)%\s*Functions/)
    const linesMatch2 = html.match(/([\d.]+)%\s*Lines/)

    if (statementsMatch2 && branchesMatch2 && functionsMatch2 && linesMatch2) {
      return {
        statements: parseFloat(statementsMatch2[1]),
        branches: parseFloat(branchesMatch2[1]),
        functions: parseFloat(functionsMatch2[1]),
        lines: parseFloat(linesMatch2[1]),
      }
    }
  } catch (error) {
    console.error('Error parsing main.ts.html:', error.message)
  }

  return null
}

function extractFromHTML(html) {
  // 从 HTML 报告中提取覆盖率数据
  const statementsMatch = html.match(/Statements\s*<\/span>\s*<span[^>]*>([\d.]+)%/)
  const branchesMatch = html.match(/Branches\s*<\/span>\s*<span[^>]*>([\d.]+)%/)
  const functionsMatch = html.match(/Functions\s*<\/span>\s*<span[^>]*>([\d.]+)%/)
  const linesMatch = html.match(/Lines\s*<\/span>\s*<span[^>]*>([\d.]+)%/)

  if (statementsMatch && branchesMatch && functionsMatch && linesMatch) {
    return {
      statements: parseFloat(statementsMatch[1]),
      branches: parseFloat(branchesMatch[1]),
      functions: parseFloat(functionsMatch[1]),
      lines: parseFloat(linesMatch[1]),
    }
  }
  return null
}

// 从 lcov.info 文件中提取 main.ts 的覆盖率数据
function extractFromLcov(lcovData) {
  try {
    // 分割成多个记录块
    const records = lcovData.split('end_of_record').filter((record) => record.trim())

    // 查找 src/main.ts 的记录
    for (const record of records) {
      const lines = record.split('\n').filter((line) => line.trim())

      // 检查是否是 main.ts 文件
      const sfLine = lines.find(
        (line) => line.startsWith('SF:') && line.includes('src/main.ts')
      )
      if (sfLine) {
        // 解析该文件的覆盖率数据
        let functionsFound = 0
        let functionsHit = 0
        let branchesFound = 0
        let branchesHit = 0
        let linesFound = 0
        let linesHit = 0

        for (const line of lines) {
          if (line.startsWith('FNF:')) {
            functionsFound = parseInt(line.substring(4)) || 0
          } else if (line.startsWith('FNH:')) {
            functionsHit = parseInt(line.substring(4)) || 0
          } else if (line.startsWith('BRF:')) {
            branchesFound = parseInt(line.substring(4)) || 0
          } else if (line.startsWith('BRH:')) {
            branchesHit = parseInt(line.substring(4)) || 0
          } else if (line.startsWith('LF:')) {
            linesFound = parseInt(line.substring(3)) || 0
          } else if (line.startsWith('LH:')) {
            linesHit = parseInt(line.substring(3)) || 0
          }
        }

        // 计算百分比
        const functionsPercent =
          functionsFound > 0 ? (functionsHit / functionsFound) * 100 : 100
        const branchesPercent =
          branchesFound > 0 ? (branchesHit / branchesFound) * 100 : 100
        const linesPercent = linesFound > 0 ? (linesHit / linesFound) * 100 : 100

        // Statements 通常与 lines 相似，这里使用 lines 作为 statements 的近似值
        const statementsPercent = linesPercent

        console.log(`Extracted coverage data from lcov.info:
          Statements: ${statementsPercent}%
          Branches: ${branchesPercent}%
          Functions: ${functionsPercent}%
          Lines: ${linesPercent}%`)

        return {
          statements: statementsPercent,
          branches: branchesPercent,
          functions: functionsPercent,
          lines: linesPercent,
        }
      }
    }
  } catch (error) {
    console.error('Error parsing lcov data:', error.message)
  }

  return null
}

// 更新 README.md 中的覆盖率信息
function updateReadme(coverage) {
  if (!coverage) {
    console.log('No coverage data available')
    return
  }

  const readmePath = path.join(__dirname, '..', 'README.md')

  if (!fs.existsSync(readmePath)) {
    console.log('README.md not found')
    return
  }

  let readme = fs.readFileSync(readmePath, 'utf8')
  console.log('Before update - Statements:', coverage.statements.toFixed(2))

  // 更新徽章链接中的覆盖率数据
  const oldBadge = readme.match(
    /!\[Coverage\]$$https:\/\/img\.shields\.io\/badge\/coverage-[\d.]+%25-[^)]+$$/
  )
  if (oldBadge) {
    console.log('Old badge:', oldBadge[0])
  }

  readme = readme.replace(
    /!\[Coverage\]\(https:\/\/img\.shields\.io\/badge\/coverage-[\d.]+%25-[^)]+\)/,
    `![Coverage](https://img.shields.io/badge/coverage-${Math.round(
      coverage.statements
    )}%25-${getBadgeColor(coverage.statements)})`
  )

  // 更新表格中的覆盖率数据（更精确的匹配）
  const oldTable = readme.match(
    /(\|\s*main\.ts\s*\|\s*)([\d.]+)(\s*\|\s*)([\d.]+)(\s*\|\s*)([\d.]+)(\s*\|\s*)([\d.]+)(\s*\|)/
  )
  if (oldTable) {
    console.log('Old table data:', oldTable[0])
  }

  readme = readme.replace(
    /(\|\s*main\.ts\s*\|\s*)([\d.]+)(\s*\|\s*)([\d.]+)(\s*\|\s*)([\d.]+)(\s*\|\s*)([\d.]+)(\s*\|)/,
    `$1${coverage.statements.toFixed(2)}$3${coverage.branches.toFixed(
      2
    )}$5${coverage.functions.toFixed(2)}$7${coverage.lines.toFixed(2)}$9`
  )

  // 更新测试覆盖率百分比
  const oldPercentage = readme.match(/✅ 目前 ([\d.]+)% 测试覆盖率/)
  if (oldPercentage) {
    console.log('Old percentage:', oldPercentage[1])
  }

  readme = readme.replace(
    /✅ 目前 ([\d.]+)% 测试覆盖率/,
    `✅ 目前 ${coverage.statements.toFixed(2)}% 测试覆盖率`
  )

  fs.writeFileSync(readmePath, readme)
  console.log(`Coverage updated: ${coverage.statements.toFixed(2)}%`)
}

function getBadgeColor(percentage) {
  if (percentage >= 95) return 'green'
  if (percentage >= 80) return 'yellow'
  if (percentage >= 70) return 'orange'
  return 'red'
}

// 主函数
function main() {
  const coverage = readCoverageReport()
  if (coverage) {
    console.log('Successfully extracted coverage data:', coverage)
    updateReadme(coverage)
  } else {
    console.log('Could not extract coverage data')
    // 添加调试信息
    const coverageDir = path.join(__dirname, '..', 'coverage')
    if (fs.existsSync(coverageDir)) {
      console.log('Coverage directory contents:', fs.readdirSync(coverageDir))

      // 检查具体文件
      const lcovReportDir = path.join(coverageDir, 'lcov-report')
      if (fs.existsSync(lcovReportDir)) {
        console.log('lcov-report directory contents:', fs.readdirSync(lcovReportDir))
      }

      const lcovInfoPath = path.join(coverageDir, 'lcov.info')
      if (fs.existsSync(lcovInfoPath)) {
        const lcovContent = fs.readFileSync(lcovInfoPath, 'utf8')
        console.log('lcov.info first 1000 chars:', lcovContent.substring(0, 1000))
      }
    } else {
      console.log('Coverage directory does not exist')
    }
  }
}

main()
