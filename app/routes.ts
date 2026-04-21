import type {RouteConfig} from '@react-router/dev/routes';
import {index, route} from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('about', 'routes/about.tsx'),
  route('archive', 'routes/archive.tsx'),
  route('blog/:slug', 'routes/post.tsx'),
  route('*', 'routes/not-found.tsx'),
] satisfies RouteConfig;
