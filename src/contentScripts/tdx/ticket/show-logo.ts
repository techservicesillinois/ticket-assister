// <rule name="TDX/Ticket/Show TkAst logo on tickets">
import { addTkAstLogoToPage } from "utils/rules/addLogo";
import { log } from "utils/logger";


try {
	addTkAstLogoToPage();
} catch (e) {
	log.e(`Failed to add logo to page: ${e instanceof Error ? e.message : e}`);
}