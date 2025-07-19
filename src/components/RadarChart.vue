<template>
  <div ref="chartRef" class="radar-chart-auto"></div>
</template>

<script setup>
import {nextTick, onBeforeUnmount, onMounted, ref, watch} from "vue";
import * as echarts from "echarts";

const props = defineProps({
  delay: Number,
  loss: Number,
  throughput: Number,
});

const chartRef = ref(null);
let chartInstance = null;
let resizeObserver = null;

function renderChart() {
  nextTick(() => {
    if (!chartRef.value) return;
    if (chartInstance) {
      chartInstance.dispose();
    }
    chartInstance = echarts.init(chartRef.value);

    // 根据容器大小动态调整配置
    const containerWidth = chartRef.value.offsetWidth;
    const containerHeight = chartRef.value.offsetHeight;
    const isMobile = containerWidth < 400;

    chartInstance.setOption({
      backgroundColor: "transparent",
      tooltip: {
        trigger: "item",
        backgroundColor: "rgba(50, 50, 50, 0.95)",
        borderColor: "#409eff",
        borderWidth: 1,
        textStyle: {
          color: "#fff",
          fontSize: isMobile ? 10 : 12,
        },
        formatter: function (params) {
          const indicators = ["时延", "丢包", "吞吐"];
          let content = `<div style="font-weight: bold; margin-bottom: 5px;">${params.name}</div>`;
          params.value.forEach((val, index) => {
            content += `<div style="display: flex; align-items: center; margin: 2px 0;">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #409eff; margin-right: 5px;"></span>
              ${indicators[index]}: <span style="color: #409eff; font-weight: bold; margin-left: 5px;">${val}</span>
            </div>`;
          });
          return content;
        },
      },
      radar: {
        indicator: [
          {
            name: "时延",
            nameGap: isMobile ? 10 : 15,
            nameTextStyle: {
              color: "#333",
              fontSize: isMobile ? 12 : 14,
              fontWeight: "bold",
            },
          },
          {
            name: "丢包",
            nameGap: isMobile ? 10 : 15,
            nameTextStyle: {
              color: "#333",
              fontSize: isMobile ? 12 : 14,
              fontWeight: "bold",
            },
          },
          {
            name: "吞吐",
            nameGap: isMobile ? 10 : 15,
            nameTextStyle: {
              color: "#333",
              fontSize: isMobile ? 12 : 14,
              fontWeight: "bold",
            },
          },
        ],
        radius: isMobile ? "60%" : "70%",
        center: ["50%", "50%"],
        shape: "circle",
        startAngle: 90,
        splitNumber: 5,
        axisLine: {
          lineStyle: {
            color: "rgba(64, 158, 255, 0.2)",
            width: 2,
          },
        },
        splitLine: {
          lineStyle: {
            color: "rgba(64, 158, 255, 0.15)",
            width: 1,
          },
        },
        splitArea: {
          show: true,
          areaStyle: {
            color: [
              "rgba(64, 158, 255, 0.02)",
              "rgba(64, 158, 255, 0.04)",
              "rgba(64, 158, 255, 0.06)",
              "rgba(64, 158, 255, 0.08)",
              "rgba(64, 158, 255, 0.1)",
            ],
          },
        },
      },
      series: [
        {
          type: "radar",
          symbol: "circle",
          symbolSize: isMobile ? 4 : 6,
          emphasis: {
            focus: "series",
            scale: true,
            scaleSize: 8,
          },
          data: [
            {
              value: [props.delay, props.loss, props.throughput],
              name: "网络性能评分",
              areaStyle: {
                color: {
                  type: "radial",
                  x: 0.5,
                  y: 0.5,
                  r: 0.5,
                  colorStops: [
                    {offset: 0, color: "rgba(64, 158, 255, 0.4)"},
                    {offset: 1, color: "rgba(64, 158, 255, 0.1)"},
                  ],
                },
              },
              lineStyle: {
                color: "#409eff",
                width: isMobile ? 2 : 3,
                shadowColor: "rgba(64, 158, 255, 0.3)",
                shadowBlur: 10,
              },
              itemStyle: {
                color: "#409eff",
                borderColor: "#fff",
                borderWidth: 2,
                shadowColor: "rgba(64, 158, 255, 0.5)",
                shadowBlur: 5,
              },
            },
          ],
        },
      ],
      animationDuration: 1500,
      animationEasing: "cubicOut",
      animationDelay: function (idx) {
        return idx * 100;
      },
    });

    // 添加鼠标悬停效果
    chartInstance.on("mouseover", function () {
      chartInstance.setOption({
        series: [
          {
            data: [
              {
                value: [props.delay, props.loss, props.throughput],
                name: "网络性能评分",
                areaStyle: {
                  color: {
                    type: "radial",
                    x: 0.5,
                    y: 0.5,
                    r: 0.5,
                    colorStops: [
                      {offset: 0, color: "rgba(64, 158, 255, 0.6)"},
                      {offset: 1, color: "rgba(64, 158, 255, 0.2)"},
                    ],
                  },
                },
                lineStyle: {
                  color: "#409eff",
                  width: isMobile ? 2 : 3,
                  shadowColor: "rgba(64, 158, 255, 0.3)",
                  shadowBlur: 10,
                },
                itemStyle: {
                  color: "#409eff",
                  borderColor: "#fff",
                  borderWidth: 2,
                  shadowColor: "rgba(64, 158, 255, 0.5)",
                  shadowBlur: 5,
                },
              },
            ],
          },
        ],
      });
    });

    chartInstance.on("mouseout", function () {
      chartInstance.setOption({
        series: [
          {
            data: [
              {
                value: [props.delay, props.loss, props.throughput],
                name: "网络性能评分",
                areaStyle: {
                  color: {
                    type: "radial",
                    x: 0.5,
                    y: 0.5,
                    r: 0.5,
                    colorStops: [
                      {offset: 0, color: "rgba(64, 158, 255, 0.4)"},
                      {offset: 1, color: "rgba(64, 158, 255, 0.1)"},
                    ],
                  },
                },
                lineStyle: {
                  color: "#409eff",
                  width: isMobile ? 2 : 3,
                  shadowColor: "rgba(64, 158, 255, 0.3)",
                  shadowBlur: 10,
                },
                itemStyle: {
                  color: "#409eff",
                  borderColor: "#fff",
                  borderWidth: 2,
                  shadowColor: "rgba(64, 158, 255, 0.5)",
                  shadowBlur: 5,
                },
              },
            ],
          },
        ],
      });
    });

    chartInstance.resize();
  });
}

onMounted(() => {
  renderChart();
  if (chartRef.value) {
    resizeObserver = new ResizeObserver(resizeChart);
    resizeObserver.observe(chartRef.value);
  }
});

function resizeChart() {
  if (chartInstance) {
    chartInstance.resize();
    renderChart(); // 重新计算并应用响应式配置
  }
}

onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.dispose();
    chartInstance = null;
  }
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
});

watch(() => [props.delay, props.loss, props.throughput], renderChart);
</script>
<style scoped>
.radar-chart-auto {
  flex: 1;
  width: 100%;
  height: 100%;
  min-height: 180px;
  position: relative;
  overflow: hidden;
  background: linear-gradient(
    135deg,
    rgba(240, 249, 255, 0.8) 0%,
    rgba(230, 247, 255, 0.9) 50%,
    rgba(245, 251, 255, 0.8) 100%
  );
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(64, 158, 255, 0.1), 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  /* 可根据父容器自适应，外部可通过style或class控制尺寸 */
}

.radar-chart-auto:hover {
  box-shadow: 0 8px 30px rgba(64, 158, 255, 0.15),
  0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.radar-chart-auto::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(
    circle at 30% 20%,
    rgba(64, 158, 255, 0.03) 0%,
    transparent 50%
  );
  pointer-events: none;
  z-index: 1;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .radar-chart-auto {
    border-radius: 8px;
  }
}
</style> 
