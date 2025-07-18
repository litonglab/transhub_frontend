// Composable
import {createRouter, createWebHistory} from "vue-router";
import {useAppStore} from "@/store/app.js";

const routes = [
  {
    path: "/",
    redirect: "/login",
  },
  {
    path: "/login",
    name: "login",
    meta: {requiresAuth: false},
    component: () => import("@/views/Login.vue"),
  },
  {
    path: "/transhub",
    name: "home",
    meta: {requiresAuth: true},
    component: () => import("@/views/Home.vue"),
    children: [
      {
        path: "help",
        name: "help",
        component: () => import("@/views/Help.vue"),
      },
      {
        path: "history",
        name: "history",
        component: () => import("@/views/History.vue"),
      },
      {
        path: "/transhub/history/:upload_id",
        name: "Detail",
        component: () => import("@/views/RecordDetail.vue"),
        props: true,
      },
      {
        path: "user",
        name: "user",
        component: () => import("@/views/User.vue"),
      },
      {
        path: "upload",
        name: "upload",
        component: () => import("@/views/Upload.vue"),
      },
      {
        path: "ranklist",
        name: "ranklist",
        component: () => import("@/views/RankList.vue"),
      },
      {
        path: "admin",
        name: "admin",
        component: () => import("@/views/Admin.vue"),
        meta: {requiresAuth: true, adminOnly: true},
      },
      {
        path: "taskqueue",
        name: "taskqueue",
        component: () => import("@/views/TaskQueue.vue"),
        meta: {requiresAuth: true, adminOnly: true},
      },
      {
        path: "dramatiq/:pathMatch(.*)*",
        name: "dramatiq",
        component: () => import("@/views/TaskQueue.vue"),
        meta: {requiresAuth: true, adminOnly: true},
        beforeEnter: (to, from, next) => {
          // 将 dramatiq 路径参数传递给组件
          to.meta.dramatiqPath = to.params.pathMatch;
          next();
        },
      },
      {
        path: "/404",
        name: "NotFound",
        component: () => import("@/views/NotFound.vue"),
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
  const store = useAppStore();

  // 检查管理员权限
  if (to.meta?.adminOnly && !store.is_admin) {
    next("/transhub/user"); // 重定向到个人中心
    return;
  }

  next();
});

export default router;
