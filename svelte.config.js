import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: null
    }),

    paths: {
      base: process.env.NODE_ENV === 'production' ? '/my-vis-5609' : ''
    }
  }
};

export default config;
