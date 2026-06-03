import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    name: 'chat',
    component: () => import('@/views/ChatView.vue')
  },
  {
    path: '/models',
    name: 'models',
    component: () => import('@/views/ModelConfigView.vue')
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;