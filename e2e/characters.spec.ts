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
    await page.getByTestId("input-role").fill("主角");
    await page.getByTestId("input-appearance").fill("银白色长发，绿色斗篷");
    await page.getByTestId("input-personality").fill("沉着冷静，足智多谋");
    await page.getByTestId("input-tags").fill("奇幻, 冒险");
    await page.getByTestId("submit-character").click();

    // 详情
    await expect(page.getByTestId("character-name")).toHaveText(name);
    await expect(page.getByText("银白色长发，绿色斗篷")).toBeVisible();

    // 复制角色卡
    await page.getByTestId("copy-prompt").click();
    await expect(page.getByText(/已复制/)).toBeVisible();
    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toContain(`## 角色设定：${name}`);
    expect(clipboard).toContain("外貌");
    expect(clipboard).toContain("保持其外貌、性格与说话风格一致");

    // 编辑
    await page.getByTestId("edit-character").click();
    await expect(page).toHaveURL(/\/edit/);
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

  test("姓名为空时无法创建", async ({ page }) => {
    const res = await page.request.post("/api/characters", {
      data: { name: "  " },
    });
    expect(res.status()).toBe(400);
  });
});
