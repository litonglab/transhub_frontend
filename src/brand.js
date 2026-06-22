const openTransHubBackgroundUrl = new URL(
  "./assets/opentranshub-home-bg.svg",
  import.meta.url
).href;

export const brand = {
  productName: "OpenTransHub",
  platformTitle: "OpenTransHub：传输协议训练平台",
  loginBrandText: "",
  loginBrandAriaLabel: "OpenTransHub",
  documentTitle: "OpenTransHub：传输协议训练平台",
  footerName: "OpenTransHub",
  copyright: "© 2025-2026 OpenTransHub. All rights reserved.",
  http3BadgeHosts: (import.meta.env.VITE_HTTP3_BADGE_HOSTS || "")
    .split(",")
    .map((host) => host.trim())
    .filter(Boolean),
  loginPage: {
    introTitle: "平台介绍",
    introText:
      "用户态协议框架 OpenTransHub 基于 UDP 协议进行实现，提供传输协议基本的功能模块，如序号、包类型、确认机制等，并提供如发送、接收等预制的接口 API。使用者需要在该框架上，修改 controller.cc 代码中的内容，实现一个拥塞控制算法，尽可能地提高网络性能。平台通过模拟不同的网络环境，并针对丢包、时延和吞吐量三个维度进行综合评分，对参赛者提供的拥塞控制算法进行评估。",
    backgroundStyle: {
      background: `url(${openTransHubBackgroundUrl}) center/cover no-repeat`,
      backgroundAttachment: "fixed",
      backgroundPosition: "center",
      backgroundSize: "cover",
    },
  },
};
