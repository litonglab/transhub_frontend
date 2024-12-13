<template>
    <div>
        <el-row>
            <div class="text-h4 pa-10" style="display: flex; justify-content: space-between; align-items: center;">
                <span style="width: 720px;">任务详情</span>
                <el-button type="primary" @click="fetchTasks" >刷新</el-button>
                <el-button type="primary" @click="router.go(-1)">返回</el-button>
            </div>
        </el-row>
        <div class="table-container">
        <el-table :data="tasks" style="width: 100%" height="500" :header-row-class-name="fixedHeader">
            <el-table-column prop="trace_name" label="测试文件" width="180"></el-table-column>
            <el-table-column prop="loss_rate" label="丢包率" width="100"></el-table-column>
            <el-table-column prop="buffer_size" label="缓冲区容量" width="100"/>
            <el-table-column prop="task_status" label="任务状态" width="100"></el-table-column>
            <el-table-column prop="task_score" label="得分" width="100"></el-table-column>
            <el-table-column label="吞吐量" width="180">
                <template #default="scope">
                    <el-button @click="showImage('throughput', scope.row.task_id)">查看</el-button>
                </template>
            </el-table-column>
            <el-table-column label="时延">
                <template #default="scope">
                    <el-button @click="showImage('delay', scope.row.task_id)">查看</el-button>
                </template>
            </el-table-column>
            <el-table-column label="日志">
                <template #default="scope">
                    <el-button @click="showLog(scope.row.log)">查看</el-button>
                </template>
            </el-table-column>
        </el-table>
        </div>
        <el-dialog v-model:="dialogVisible">
            <img v-if="dialogType === 'image'" :src="dialogContent" style="width: 100%;" />
            <div v-else>
                <textarea v-model="dialogContent" style="width: 100%; height: 400px; white-space: pre-wrap;"
                    readonly></textarea>
            </div>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute,useRouter } from 'vue-router';
import { useAppStore } from "@/store/app.js";
import { APIS } from "@/config";
import { ElMessage } from 'element-plus';

const route = useRoute();
const router = useRouter();
const store = useAppStore();

const upload_id = route.params.upload_id;
const tasks = ref([]);

const dialogVisible = ref(false);
const dialogContent = ref('');
const dialogType = ref('');

async function fetchTasks() {
    try {
        const response = await fetch(APIS.get_history_record_detail, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                upload_id: upload_id,
                user_id: store.user_id,
                cname: store.cname
            })
        });

        const data = await response.json();

        if (data.code === 200) {
            tasks.value = data.tasks;
            ElMessage({
                message: '加载成功',
                type: 'success'
            });
        } else {
            console.error(data.message);
        }
    } catch (error) {
        console.error("Error fetching tasks", error);
    }
}

async function showImage(type, task_id) {
    try {
        const response = await fetch(APIS.get_graph, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                user_id: store.user_id,
                task_id: task_id,
                graph_type: type
            })
        });

        if (!response.ok) {
            const result = await response.json();
            console.error(result.message);
            return;
        }

        const contentType = response.headers.get('Content-Type');
        if (!contentType || !contentType.startsWith('image/')) {
            console.error("Returned content is not an image:", contentType);
            return;
        }

        const blob = await response.blob();
        if (blob.size === 0) {
            console.error("Blob is empty");
            return;
        }

        const blobUrl = URL.createObjectURL(blob);
        dialogContent.value = blobUrl.startsWith('blob:') ? blobUrl : `blob:${blobUrl}`;
        console.log("Blob URL:", dialogContent.value); // Debug: Check the URL
        dialogType.value = 'image';
        dialogVisible.value = true;
        console.log("Dialog visible:", dialogVisible.value); // Debug: Check the dialog visibility
    } catch (error) {
        console.error("Error fetching image", error);
    }
}

function showLog(logContent) {
    dialogContent.value = logContent;
    dialogType.value = 'log';
    dialogVisible.value = true;
}

onMounted(() => {
    fetchTasks();
});
</script>

<style scoped>
.table-container {
    height: 500px; /* 设置固定高度 */
    overflow-y: auto; /* 启用垂直滚动 */
}

.fixed-header {
    position: sticky;
    top: 0;
    background: white;
    z-index: 1;
}
</style>