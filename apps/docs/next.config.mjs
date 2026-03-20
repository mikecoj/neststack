import nextra from 'nextra';

const withNextra = nextra({
  defaultShowCopyCode: true,
});

export default withNextra({
  output: 'export',
  basePath: '/nestx-advanced-packages',
  images: { unoptimized: true },
  reactStrictMode: true,
  turbopack: {
    resolveAlias: {
      'next-mdx-import-source-file': './mdx-components.tsx',
    },
  },
});
