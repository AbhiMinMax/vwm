// Engine test runner — run with: node scripts/test-engine.js
import { templates }  from '../src/data/templates.js'
import { __test as testSlotFiller }         from '../src/engine/slotFiller.js'
import { __test as testTemplateSelector }   from '../src/engine/templateSelector.js'
import { __test as testSessionBuilder }     from '../src/engine/sessionBuilder.js'
import { __test as testPerformanceTracker } from '../src/engine/performanceTracker.js'
import { __test as testAdaptiveEngine }     from '../src/engine/adaptiveEngine.js'

console.log('\n=== slotFiller ===')
testSlotFiller()

console.log('\n=== templateSelector ===')
testTemplateSelector(templates)

console.log('\n=== sessionBuilder ===')
testSessionBuilder(templates)

console.log('\n=== performanceTracker ===')
testPerformanceTracker()

console.log('\n=== adaptiveEngine ===')
testAdaptiveEngine()

console.log('\n=== All engine tests complete ===')
