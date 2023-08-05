// <rule name="Cerebro/Show TkAst logo on Cerebro">
import { addTkAstLogoToPage } from "utils/rules/addLogo";
import { log } from "utils/logger";


try {
	addTkAstLogoToPage();
} catch (e) {
	log.e(`Failed to add logo to page: ${e instanceof Error ? e.message : e}`);
}
