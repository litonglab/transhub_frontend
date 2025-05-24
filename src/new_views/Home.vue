<template>
  <v-app>
    <v-app-bar color="error">
      <v-container class="fill-height d-flex">
        <v-app-bar-title>
          Transhub：中国人民大学“一人一栈”打榜平台
        </v-app-bar-title>

        <v-spacer></v-spacer>
        <v-btn>
          {{user_name}}
        </v-btn>
        <v-btn @click="logout">
          退出登录
        </v-btn>

      </v-container>
    </v-app-bar>

    <v-main class="bg-grey-lighten-3">
      <v-container>
        <v-row>
          <v-col cols="2">
            <v-sheet rounded="lg">
              <v-list rounded="lg">
                <v-list-item
                  v-for="power in powers.array"
                  :key="power.id_name"
                  :to="{name: power.id_name}"
                  @click="selected_component=power.id_name"
                  link
                  color="success"
                >
                  <v-list-item-title>
                    {{ power.power_info }}
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-sheet>
          </v-col>

          <v-col cols="10">
            <v-card
              min-height="80vh"
              rounded="lg"
              style="overflow-y: auto;overflow-x: auto"
            >
              <router-view/>

            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { reactive, ref} from "vue";
import {useAppStore} from "@/store/app.js";
import {useRouter} from 'vue-router';

const router = useRouter()

const store = useAppStore();

// const powers = ref([])
const user_name = store.name
const selected_component = ref("student")
const info=[
  {id_name:'help',power_info:'竞赛指南'}, 
  {id_name:'upload',power_info:'算法提交'},  
  {id_name:'ranklist',power_info:'榜单展示'},   
  {id_name:'user',power_info:'个人中心'}, 
  {id_name:'history',power_info:'历史记录'}
]

const powers = reactive({
  array: info
})

function logout() {
  store.set_user_id("")
  store.set_name("")
  store.set_cname("")

  console.log("logout")
  router.push({name: 'login'})
}

</script>

<style scoped>

</style>
