<script setup lang="ts">
import { doApi } from "~/utils/api";

definePageMeta({ layout: "admin", middleware: ["admin"] });
useAdminPageHead("用户管理 — ForcedSkin 后台");

interface AdminUserRow {
  id: string;
  name: string;
  email: string | null;
  avatar: string | null;
  roles: string | null;
  createdAt: string;
  lastLoginAt: string | null;
}

const list = ref<AdminUserRow[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = 20;
const pages = ref(0);
const loading = ref(true);

function formatDt(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("zh-CN", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return "—";
  }
}

function roleBadges(roles: string | null) {
  if (!roles?.trim()) return ["user"];
  return roles.split(",").map((r) => r.trim()).filter(Boolean);
}

async function load() {
  loading.value = true;
  try {
    const res = await doApi.get<{ total: number; page: number; pageSize: number; pages: number; list: AdminUserRow[] }>(
      "api/admin/users",
      { page: page.value, pageSize },
    );
    total.value = res.total ?? 0;
    pages.value = res.pages ?? 0;
    list.value = res.list ?? [];
  } finally {
    loading.value = false;
  }
}

function goPage(p: number) {
  const next = Math.min(Math.max(1, p), Math.max(1, pages.value));
  if (next === page.value) return;
  page.value = next;
  load();
}

onMounted(load);
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-10">
    <div class="flex flex-wrap items-end justify-between gap-3 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-foreground">用户管理</h1>
        <p class="text-muted text-sm mt-1">注册用户信息一览（仅展示，后续可扩展操作）。</p>
      </div>
      <p v-if="!loading" class="text-sm text-muted">
        共 <span class="font-medium text-foreground">{{ total }}</span> 人
      </p>
    </div>

    <div v-if="loading" class="space-y-2">
      <div v-for="i in 8" :key="i" class="h-14 rounded-xl bg-surface-muted animate-pulse"></div>
    </div>

    <template v-else>
      <div class="rounded-xl border border-border bg-surface overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left min-w-[640px]">
            <thead>
              <tr class="border-b border-border bg-surface-muted/60 text-muted text-xs uppercase tracking-wide">
                <th class="px-4 py-3 font-medium">用户</th>
                <th class="px-4 py-3 font-medium w-48">邮箱</th>
                <th class="px-4 py-3 font-medium">角色</th>
                <th class="px-4 py-3 font-medium whitespace-nowrap">注册时间</th>
                <th class="px-4 py-3 font-medium whitespace-nowrap">最后登录</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in list" :key="u.id" class="border-b border-border last:border-b-0 hover:bg-surface-muted/40 transition-colors">
                <td class="px-4 py-3">
                  <div class="flex items-center gap-3 min-w-0">
                    <img
                      v-if="u.avatar"
                      :src="u.avatar"
                      :alt="u.name"
                      class="w-9 h-9 rounded-full object-cover bg-surface-muted shrink-0"
                      loading="lazy"
                    />
                    <div v-else class="w-9 h-9 rounded-full bg-primary-500/15 text-primary-600 flex items-center justify-center text-xs font-bold shrink-0">
                      {{ (u.name || "?").slice(0, 1).toUpperCase() }}
                    </div>
                    <div class="min-w-0">
                      <p class="font-medium text-foreground truncate">{{ u.name || "—" }}</p>
                      <p class="text-xs text-muted font-mono truncate" :title="u.id">{{ u.id }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-3 text-muted truncate max-w-[12rem]" :title="u.email || ''">
                  {{ u.email || "—" }}
                </td>
                <td class="px-4 py-3">
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="r in roleBadges(u.roles)"
                      :key="`${u.id}-${r}`"
                      class="text-xs px-1.5 py-0.5 rounded font-medium"
                      :class="r === 'admin' ? 'bg-primary-100 text-primary-700' : 'bg-surface-muted text-muted'"
                    >{{ r }}</span>
                  </div>
                </td>
                <td class="px-4 py-3 text-muted whitespace-nowrap">{{ formatDt(u.createdAt) }}</td>
                <td class="px-4 py-3 text-muted whitespace-nowrap">{{ formatDt(u.lastLoginAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="list.length === 0" class="text-center py-16 text-muted">暂无用户数据</div>

      <div v-else-if="pages > 1" class="flex items-center justify-center gap-4 mt-6">
        <button
          type="button"
          class="px-3 py-1.5 rounded-lg text-sm border border-border text-muted hover:bg-surface-muted disabled:opacity-40 disabled:pointer-events-none transition-colors"
          :disabled="page <= 1"
          @click="goPage(page - 1)"
        >
          上一页
        </button>
        <span class="text-sm text-muted">{{ page }} / {{ pages }}</span>
        <button
          type="button"
          class="px-3 py-1.5 rounded-lg text-sm border border-border text-muted hover:bg-surface-muted disabled:opacity-40 disabled:pointer-events-none transition-colors"
          :disabled="page >= pages"
          @click="goPage(page + 1)"
        >
          下一页
        </button>
      </div>
    </template>
  </div>
</template>
