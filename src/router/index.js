// Composables
import {createRouter, createWebHistory} from "vue-router";

const routes = [
  {
    path: "/",
    redirect: "/login",
  },
  {
    path: "/login",
    name: "login",
    meta: {requiresAuth: false},
    component: () => import("@/new_views/Login.vue"),
  },
  {
    path: "/transhub",
    name: "home",
    meta: {requiresAuth: true},
    component: () => import("@/new_views/Home.vue"),
    children: [
      {
        path: "help",
        name: "help",
        component: () => import("@/new_views/Help.vue"),
      },
      {
        path: "history",
        name: "history",
        component: () => import("@/new_views/History.vue"),
      },
      {
        path: '/transhub/history/:upload_id',
        name: 'Detail',
        component: () => import('@/new_views/RecordDetail.vue'),
        props: true,
      },
      {
        path: "user",
        name: "user",
        component: () => import("@/new_views/User.vue"),
      },
      {
        path: "upload",
        name: "upload",
        component: () => import("@/new_views/Upload.vue"),
      },
      {
        path: "ranklist",
        name: "ranklist",
        component: () => import("@/new_views/RankList.vue"),
      },
      {
        path: "/404",
        name: "NotFound",
        component: () => import("@/new_views/NotFound.vue"),
      },
      // 所有未定义路由，全部重定向到404页
      {
        path: "/:pathMatch(.*)",
        redirect: "/404",
        hidden: true,
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

router.beforeEach((to, from, next) => {
  next();
  // const appStore = useAppStore();
  // if (appStore.user_id != null) {
  //   next();
  // } else {
  //   // const {$cookies} = router.app.config.globalProperties
  //   // Check if the route requires authentication and user is not logged in
  //   next("/login");
  // }
});

export default router;
