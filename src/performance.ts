import { PerformanceObserver } from "perf_hooks";
import { ExtensionContext } from "vscode";
import * as main from "./main";

const performanceObserver = new PerformanceObserver((list) => {
    const entry = list.getEntries()[0];
    if(main.config.get<boolean>("performance.log")) {
        main.output.appendLine(`${entry.name}: ${entry.duration}ms`);
    }
});

export function init(context: ExtensionContext): void {
    performanceObserver.observe({ entryTypes: ["function"] });
}