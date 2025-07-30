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

// 配置常量
const CHART_COLORS = {
  primary: "#409eff",
  background: "rgba(64, 158, 255, 0.2)",
  splitLine: "rgba(64, 158, 255, 0.15)",
  shadow: "rgba(64, 158, 255, 0.3)",
  itemShadow: "rgba(64, 158, 255, 0.5)",
};

const INDICATORS = ["时延", "丢包", "吞吐"];

// 创建tooltip配置
function createTooltipConfig(isMobile) {
  return {
    trigger: "item",
    backgroundColor: "rgba(50, 50, 50, 0.95)",
    borderColor: CHART_COLORS.primary,
    borderWidth: 1,
    textStyle: {
      color: "#fff",
      fontSize: isMobile ? 10 : 12,
    },
    formatter: function (params) {
      let content = `<div style="font-weight: bold; margin-bottom: 5px;">${params.name}</div>`;
      params.value.forEach((val, index) => {
        content += `<div style="display: flex; align-items: center; margin: 2px 0;">
          <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${CHART_COLORS.primary}; margin-right: 5px;"></span>
          ${INDICATORS[index]}: <span style="color: ${CHART_COLORS.primary}; font-weight: bold; margin-left: 5px;">${val}</span>
        </div>`;
      });
      return content;
    },
  };
}

// 创建指标配置
function createIndicator(name, isMobile) {
  return {
    name,
    max: 100,
    min: 0,
    nameGap: isMobile ? 10 : 15,
    nameTextStyle: {
      color: "#333",
      fontSize: isMobile ? 12 : 14,
      fontWeight: "bold",
    },
  };
}

// 创建系列数据
function createSeriesData(isHover = false, isMobile = false) {
  return {
    value: [
      props.delay.toFixed(2),
      props.loss.toFixed(2),
      props.throughput.toFixed(2),
    ],
    name: "网络性能评分",
    areaStyle: {
      color: {
        type: "radial",
        x: 0.5,
        y: 0.5,
        r: 0.5,
        colorStops: [
          {
            offset: 0,
            color: isHover
              ? "rgba(64, 158, 255, 0.6)"
              : "rgba(64, 158, 255, 0.4)",
          },
          {
            offset: 1,
            color: isHover
              ? "rgba(64, 158, 255, 0.2)"
              : "rgba(64, 158, 255, 0.1)",
          },
        ],
      },
    },
    lineStyle: {
      color: CHART_COLORS.primary,
      width: isMobile ? 2 : 3,
      shadowColor: CHART_COLORS.shadow,
      shadowBlur: 10,
    },
    itemStyle: {
      color: CHART_COLORS.primary,
      borderColor: "#fff",
      borderWidth: 2,
      shadowColor: CHART_COLORS.itemShadow,
      shadowBlur: 5,
    },
  };
}

function renderChart() {
  nextTick(() => {
    if (!chartRef.value) return;
    if (chartInstance) {
      chartInstance.dispose();
    }
    chartInstance = echarts.init(chartRef.value);

    const isMobile = chartRef.value.offsetWidth < 400;

    chartInstance.setOption({
      backgroundColor: "transparent",
      tooltip: createTooltipConfig(isMobile),
      radar: {
        indicator: INDICATORS.map((name) => createIndicator(name, isMobile)),
        radius: isMobile ? "60%" : "70%",
        center: ["50%", "50%"],
        shape: "circle",
        startAngle: 90,
        splitNumber: 5,
        axisLine: {
          lineStyle: {
            color: CHART_COLORS.background,
            width: 2,
          },
        },
        splitLine: {
          lineStyle: {
            color: CHART_COLORS.splitLine,
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
                color: CHART_COLORS.primary,
                width: isMobile ? 2 : 3,
                shadowColor: CHART_COLORS.shadow,
                shadowBlur: 10,
              },
              itemStyle: {
                color: CHART_COLORS.primary,
                borderColor: "#fff",
                borderWidth: 2,
                shadowColor: CHART_COLORS.itemShadow,
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
        series: [{data: [createSeriesData(true, isMobile)]}],
      });
    });

    chartInstance.on("mouseout", function () {
      chartInstance.setOption({
        series: [{data: [createSeriesData(false, isMobile)]}],
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
