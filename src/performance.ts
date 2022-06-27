import { performance, PerformanceObserver } from "perf_hooks";
import { ExtensionContext } from "vscode";
import { config, output } from "./main";

const performanceObserver = new PerformanceObserver((list) => {
    const entry = list.getEntries()[0];
    if(config.get<boolean>("performance.log")) {
        output.appendLine(`${entry.name}: ${entry.duration}ms`);
    }
});

export function init(context: ExtensionContext, ) {
    performanceObserver.observe({ entryTypes: ["function"] });
}