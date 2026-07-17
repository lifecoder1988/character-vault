import { test, expect } from "@playwright/test";

test.use({ permissions: ["clipboard-read", "clipboard-write"] });

test.describe("人物库", () => {
  test("首页正常渲染", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/人物库/);
    await expect(page.getByRole("heading", { name: "人物库" })).toBeVisible();
    await expect(page.getByTestId("new-character")).toBeVisible();
  });

  test("完整旅程：创建 → 详情 → 复制角色卡 → 编辑 → 删除", async ({ page }) => {
    const name = `测试人物${Date.now()}`;
    const updatedName = `${name}·改`;

    // 创建
    await page.goto("/");
    await page.getByTestId("new-character").click();
    await expect(page).toHaveURL(/\/characters\/new/);
    await page.getByTestId("input-name").fill(name);
    // 形象 tab（默认）
    await page.getByRole("button", { name: "银白色", exact: true }).click();
    await page.getByRole("button", { name: "穿斗篷", exact: true }).click();
    await page.getByTestId("input-appearance-custom").fill("左眼角有星形印记");
    // 特质 tab
    await page.getByRole("tab", { name: "特质" }).click();
    await page.getByRole("button", { name: "主角", exact: true }).click();
    await page.getByRole("button", { name: "冷静", exact: true }).click();
    await page.getByRole("button", { name: "机智", exact: true }).click();
    // 背景 tab
    await page.getByRole("tab", { name: "背景" }).click();
    await page.getByRole("button", { name: "奇幻", exact: true }).click();
    await page.getByRole("button", { name: "冒险", exact: true }).click();
    // 实时预览同步成型
    await expect(page.getByTestId("preview-name")).toHaveText(name);
    await expect(page.getByTestId("preview-card")).toContainText("冷静、机智");
    await page.getByTestId("submit-character").click();

    // 详情（dev 下 edge 路由首次编译较慢，放宽跳转等待）
    await expect(page).toHaveURL(/\/characters\/\d+$/, { timeout: 20_000 });
    await expect(page.getByTestId("character-name")).toHaveText(name, {
      timeout: 10_000,
    });
    await expect(page.getByText("银白色、穿斗篷、左眼角有星形印记")).toBeVisible();
    await expect(page.getByText("冷静、机智")).toBeVisible();

    // 复制角色卡
    await page.getByTestId("copy-prompt").click();
    await expect(page.getByText(/已复制/)).toBeVisible();
    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toContain(`## 角色设定：${name}`);
    expect(clipboard).toContain("外貌");
    expect(clipboard).toContain("保持其外貌、性格与说话风格一致");

    // 编辑（已选选项应回填为选中态）
    await page.getByTestId("edit-character").click();
    await expect(page).toHaveURL(/\/edit/);
    await page.getByRole("tab", { name: "特质" }).click();
    await expect(
      page.getByRole("button", { name: "冷静", exact: true })
    ).toHaveAttribute("aria-pressed", "true");
    await page.getByTestId("input-name").fill(updatedName);
    await page.getByTestId("submit-character").click();
    await expect(page.getByTestId("character-name")).toHaveText(updatedName);

    // 列表中可见
    await page.goto("/");
    await expect(
      page.getByTestId("character-card").filter({ hasText: updatedName })
    ).toBeVisible();

    // 删除
    await page
      .getByTestId("character-card")
      .filter({ hasText: updatedName })
      .click();
    await page.getByTestId("delete-character").click();
    await page.getByTestId("confirm-delete").click();
    await expect(page).toHaveURL("/");
    await expect(
      page.getByTestId("character-card").filter({ hasText: updatedName })
    ).toHaveCount(0);
  });

  test("搜索过滤人物", async ({ page }) => {
    const keeper = `搜索目标${Date.now()}`;
    const other = `无关人物${Date.now()}`;

    for (const n of [keeper, other]) {
      const res = await page.request.post("/api/characters", {
        data: { name: n, tags: "e2e" },
      });
      expect(res.ok()).toBeTruthy();
    }

    await page.goto("/");
    await page.getByTestId("search-input").fill(keeper);
    await expect(
      page.getByTestId("character-card").filter({ hasText: keeper })
    ).toBeVisible();
    await expect(
      page.getByTestId("character-card").filter({ hasText: other })
    ).toHaveCount(0);

    // 清理
    const list = await page.request.get("/api/characters");
    const { characters } = (await list.json()) as {
      characters: { id: number; name: string }[];
    };
    for (const c of characters) {
      if (c.name === keeper || c.name === other) {
        await page.request.delete(`/api/characters/${c.id}`);
      }
    }
  });

  test("随机姓名按钮可生成姓名", async ({ page }) => {
    await page.goto("/characters/new");
    await page.getByTestId("random-name").click();
    await expect(page.getByTestId("input-name")).not.toHaveValue("");
  });

  test("随机捏一个：一键生成完整人物并实时预览", async ({ page }) => {
    await page.goto("/characters/new");
    await page.getByTestId("randomize-all").click();
    await expect(page.getByTestId("input-name")).not.toHaveValue("");
    await expect(page.getByTestId("preview-name")).not.toHaveText("未命名人物");
    // 预览卡应出现性格文案（随机至少选中 2 个性格）
    await expect(page.getByTestId("preview-card")).toContainText("性格");
  });

  test("姓名为空时无法创建", async ({ page }) => {
    const res = await page.request.post("/api/characters", {
      data: { name: "  " },
    });
    expect(res.status()).toBe(400);
  });
});
