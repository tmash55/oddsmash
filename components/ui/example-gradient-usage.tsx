import React from 'react';

/**
 * Example component showing how to use the new gradient and scanner colors
 * from our CSS variables. You can use these patterns throughout your app.
 */
export function ExampleGradientUsage() {
  return (
    <div className="space-y-6 p-6">
      {/* Using utility classes */}
      <div className="bg-gradient-blue-purple p-6 rounded-lg text-white">
        <h3 className="text-lg font-semibold">Blue to Purple Gradient</h3>
        <p>Using the .bg-gradient-blue-purple utility class</p>
      </div>

      <div className="bg-gradient-purple-blue p-6 rounded-lg text-white">
        <h3 className="text-lg font-semibold">Purple to Blue Gradient</h3>
        <p>Using the .bg-gradient-purple-blue utility class</p>
      </div>

      {/* Using scanner blacks */}
      <div className="bg-scanner-black p-6 rounded-lg text-white">
        <h3 className="text-lg font-semibold">Scanner Black Background</h3>
        <p>Perfect for betslip scanner interfaces</p>
      </div>

      <div className="bg-scanner-black-lighter p-6 rounded-lg text-white">
        <h3 className="text-lg font-semibold">Lighter Scanner Black</h3>
        <p>Great for cards within scanner interfaces</p>
      </div>

      {/* Glassmorphic effects */}
      <div className="bg-gradient-blue-purple p-8 rounded-lg">
        <div className="glassmorphic p-4 rounded-lg text-white">
          <h3 className="text-lg font-semibold">Glassmorphic Card</h3>
          <p>Glass effect with backdrop blur</p>
        </div>
      </div>

      {/* Using CSS variables directly in styles */}
      <div 
        className="p-6 rounded-lg text-white"
        style={{
          background: `linear-gradient(45deg, hsl(var(--gradient-blue-start)), hsl(var(--gradient-purple-end)))`
        }}
      >
        <h3 className="text-lg font-semibold">Custom Gradient</h3>
        <p>Using CSS variables directly for custom gradients</p>
      </div>

      {/* Individual color usage */}
      <div className="grid grid-cols-2 gap-4">
        <div 
          className="p-4 rounded-lg text-white"
          style={{ backgroundColor: 'hsl(var(--scanner-black))' }}
        >
          Scanner Black
        </div>
        <div 
          className="p-4 rounded-lg text-white"
          style={{ backgroundColor: 'hsl(var(--scanner-black-lighter))' }}
        >
          Scanner Black Lighter
        </div>
      </div>
    </div>
  );
}

// Usage examples for your existing components:
/*

// In your onboarding components, replace:
className="bg-gradient-to-br from-blue-600 to-purple-600"
// With:
className="bg-gradient-blue-purple"

// In your betslip scanner, replace:
className="bg-gray-900"
// With:
className="bg-scanner-black"

// For glassmorphic cards, replace complex backdrop-blur styles with:
className="glassmorphic"

// For custom gradients, use the CSS variables:
style={{
  background: `linear-gradient(135deg, hsl(var(--gradient-blue-start)), hsl(var(--gradient-blue-end)))`
}}

*/ 