const fs = require('fs');

function replaceAny(filePath, regex, replacement) {
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        content = content.replace(regex, replacement);
        fs.writeFileSync(filePath, content);
        console.log(`Patched ${filePath}`);
    }
}

replaceAny(
    'src/context/DataContext.perf.test.tsx',
    /const callbacks: Set<\(msgs: any\[\]\) => void> = new Set\(\);/,
    'const callbacks: Set<(msgs: unknown[]) => void> = new Set();'
);
replaceAny(
    'src/context/DataContext.perf.test.tsx',
    /triggerMessages: \(msgs: any\[\]\) => \{/,
    'triggerMessages: (msgs: unknown[]) => {'
);
replaceAny(
    'src/context/DataContext.perf.test.tsx',
    /subscribe: \(cb: any\) => \{/,
    'subscribe: (cb: (msgs: unknown[]) => void) => {'
);
replaceAny(
    'src/context/AuthContext.tsx',
    /user: any;/,
    'user: unknown;'
);
replaceAny(
    'src/components/UI/Button.test.tsx',
    /const mockOnClick = vi.fn\(\) as any;/,
    'const mockOnClick = vi.fn() as unknown as () => void;'
);
