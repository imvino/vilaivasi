"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function BrandMatcherPage() {
  const [flipkartBrands, setFlipkartBrands] = useState([]);
  const [amazonBrands, setAmazonBrands] = useState([]);
  const [brandsInGroups, setBrandsInGroups] = useState([]);
  const [matches, setMatches] = useState([]);
  const [brandGroups, setBrandGroups] = useState([]);
  const [threshold, setThreshold] = useState(85);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selected, setSelected] = useState([]); // [{source, id, name}]
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [canonicalName, setCanonicalName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("brands"); // "brands" or "groups"
  const [notification, setNotification] = useState(null);
  const [hideGroupedBrands, setHideGroupedBrands] = useState(true);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    await Promise.all([
      loadBrands(),
      loadBrandGroups(),
      loadBrandsInGroups()
    ]);
  };

  const loadBrands = async () => {
    try {
      const [flipkartRes, amazonRes] = await Promise.all([
        fetch("/api/brands/flipkart"),
        fetch("/api/brands/amazon")
      ]);
      
      const flipkartData = await flipkartRes.json();
      const amazonData = await amazonRes.json();
      
      setFlipkartBrands(flipkartData.brands || []);
      setAmazonBrands(amazonData.brands || []);
    } catch (error) {
      console.error("Error loading brands:", error);
      showNotification("Error loading brands", "error");
    }
  };

  const loadBrandsInGroups = async () => {
    try {
      const res = await fetch("/api/brands/in-groups");
      const data = await res.json();
      setBrandsInGroups(data.brandsInGroups || []);
    } catch (error) {
      console.error("Error loading brands in groups:", error);
      showNotification("Error loading brands in groups", "error");
    }
  };

  const loadBrandGroups = async () => {
    try {
      const res = await fetch("/api/brands/groups");
      const data = await res.json();
      setBrandGroups(data.groups || []);
    } catch (error) {
      console.error("Error loading brand groups:", error);
      showNotification("Error loading brand groups", "error");
    }
  };

  const handleMatch = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/brands/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "flipkart-amazon", threshold })
      });
      const data = await res.json();
      
      if (data.matches && data.matches.length > 0) {
        // Filter out matches where either brand is already in a group
        const filteredMatches = hideGroupedBrands 
          ? data.matches.filter(match => 
              !isBrandInGroup(match.brand1.name, 'flipkart') && 
              !isBrandInGroup(match.brand2.name, 'amazon')
            )
          : data.matches;
        
        setMatches(filteredMatches);
        
        if (filteredMatches.length > 0) {
          showNotification(`Found ${filteredMatches.length} potential matches`, "success");
        } else {
          showNotification("No new matches found. All matching brands are already in groups.", "info");
        }
      } else {
        setMatches([]);
        showNotification("No matches found. Try lowering the threshold.", "info");
      }
    } catch (error) {
      console.error("Error running fuzzy match:", error);
      showNotification("Error running fuzzy match", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (brand, source) => {
    // Check if this brand is already in a group
    if (hideGroupedBrands && isBrandInGroup(brand.name, source)) {
      showNotification(`"${brand.name}" is already in a group. Ungroup it first.`, "warning");
      return;
    }
    
    setSelected(prev => {
      const exists = prev.find(x => x.id === brand.id && x.source === source);
      if (exists) return prev.filter(x => !(x.id === brand.id && x.source === source));
      return [...prev, { ...brand, source }];
    });
  };

  const openGroupModal = () => {
    if (selected.length < 2) {
      showNotification("Please select at least 2 brands to group", "warning");
      return;
    }
    
    // Check for duplicates in selection - but only consider duplicates within the same source
    const duplicatesBySource = {};
    const duplicates = [];
    
    selected.forEach(brand => {
      const key = `${brand.source}:${brand.name.toLowerCase()}`;
      if (duplicatesBySource[key]) {
        duplicates.push(`${brand.name} (${brand.source})`);
      } else {
        duplicatesBySource[key] = true;
      }
    });
    
    if (duplicates.length > 0) {
      showNotification(`Duplicate brands selected: ${duplicates.join(', ')}`, "warning");
      return;
    }
    
    setCanonicalName(selected[0].name);
    setShowGroupModal(true);
  };

  const saveGroup = async () => {
    try {
      const res = await fetch("/api/brands/group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          canonicalName,
          brandEntries: selected.map(b => ({ brandName: b.name, source: b.source }))
        })
      });
      
      const data = await res.json();
      
      if (data.success || data.groupId) {
        showNotification(`Group "${canonicalName}" created successfully`, "success");
        setShowGroupModal(false);
        setSelected([]);
        setCanonicalName("");
        
        // Reload data to update everything
        await loadAllData();
        
        // Clear matches that contain the grouped brands
        if (hideGroupedBrands) {
          const selectedBrandNames = selected.map(b => b.name);
          const selectedSources = selected.map(b => b.source);
          
          setMatches(prev => prev.filter(match => 
            !(selectedBrandNames.includes(match.brand1.name) && selectedSources.includes('flipkart')) &&
            !(selectedBrandNames.includes(match.brand2.name) && selectedSources.includes('amazon'))
          ));
        }
      } else {
        showNotification(data.error || "Failed to create group", "error");
      }
    } catch (error) {
      console.error("Error saving brand group:", error);
      showNotification("Error saving brand group", "error");
    }
  };

  const deleteGroup = async (groupId, groupName) => {
    if (!confirm(`Are you sure you want to delete the group "${groupName}"?`)) {
      return;
    }
    
    setDeleteLoading(true);
    try {
      const res = await fetch("/api/brands/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId })
      });
      
      const data = await res.json();
      
      if (data.success) {
        showNotification(data.message || `Group deleted successfully`, "success");
        await loadAllData(); // Reload all data after deletion
      } else {
        showNotification(data.error || "Failed to delete group", "error");
      }
    } catch (error) {
      console.error("Error deleting brand group:", error);
      showNotification("Error deleting brand group", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  const showNotification = (message, type = "info") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000); // Auto-dismiss after 5 seconds
  };

  // Check if a brand is already in a group
  const isBrandInGroup = (brandName, source) => {
    return brandsInGroups.some(b => 
      b.brand_name.toLowerCase() === brandName.toLowerCase() && 
      b.source === source
    );
  };

  // Filter brands that are already in groups if hideGroupedBrands is true
  const getFilteredBrands = (brands, source) => {
    if (!hideGroupedBrands) return brands;
    
    return brands.filter(brand => !isBrandInGroup(brand.name, source));
  };

  const filteredFlipkartBrands = getFilteredBrands(
    searchTerm 
      ? flipkartBrands.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase()))
      : flipkartBrands,
    'flipkart'
  );

  const filteredAmazonBrands = getFilteredBrands(
    searchTerm 
      ? amazonBrands.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase()))
      : amazonBrands,
    'amazon'
  );

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Brand Matcher Dashboard</h1>
      
      {notification && (
        <div className={`mb-4 p-3 rounded ${
          notification.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' :
          notification.type === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' :
          notification.type === 'warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100' :
          'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
        }`}>
          {notification.message}
        </div>
      )}
      
      <div className="flex mb-6 border-b">
        <button 
          className={`px-4 py-2 ${activeTab === 'brands' ? 'border-b-2 border-blue-500 font-semibold' : ''}`}
          onClick={() => setActiveTab('brands')}
        >
          Match Brands
        </button>
        <button 
          className={`px-4 py-2 ${activeTab === 'groups' ? 'border-b-2 border-blue-500 font-semibold' : ''}`}
          onClick={() => setActiveTab('groups')}
        >
          View Groups
        </button>
      </div>

      {activeTab === 'brands' ? (
        <>
          <div className="flex gap-4 mb-4 items-center flex-wrap">
            <Button onClick={handleMatch} disabled={loading}>
              {loading ? "Matching..." : "Run Fuzzy Match"}
            </Button>
            <div className="flex items-center">
              <span className="mr-2">Threshold:</span>
              <input
                type="number"
                min={50}
                max={100}
                value={threshold}
                onChange={e => setThreshold(Number(e.target.value))}
                className="border rounded px-2 py-1 w-24"
              />
            </div>
            <Button 
              onClick={openGroupModal} 
              disabled={selected.length < 2}
              className={selected.length < 2 ? "opacity-50" : ""}
            >
              Group Selected ({selected.length})
            </Button>
            {selected.length > 0 && (
              <Button 
                variant="outline" 
                onClick={() => setSelected([])}
                className="ml-2"
              >
                Clear Selection
              </Button>
            )}
            <div className="flex items-center ml-4">
              <input
                type="checkbox"
                id="hideGroupedBrands"
                checked={hideGroupedBrands}
                onChange={e => setHideGroupedBrands(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="hideGroupedBrands">Hide brands already in groups</label>
            </div>
            <div className="ml-auto">
              <input
                type="text"
                placeholder="Search brands..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="border rounded px-2 py-1 w-64"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h2 className="font-semibold mb-2">
                Flipkart Brands ({filteredFlipkartBrands.length})
                {hideGroupedBrands && flipkartBrands.length > filteredFlipkartBrands.length && 
                  ` (${flipkartBrands.length - filteredFlipkartBrands.length} hidden)`
                }
              </h2>
              <ul className="h-96 overflow-auto border rounded p-2">
                {filteredFlipkartBrands.map(b => (
                  <li
                    key={b.id}
                    className={`cursor-pointer px-2 py-1 rounded ${selected.find(x => x.id === b.id && x.source === "flipkart") ? "bg-blue-100 dark:bg-blue-900" : ""}`}
                    onClick={() => handleSelect(b, "flipkart")}
                  >
                    {b.name} <span className="text-xs text-gray-400">({b.product_count})</span>
                  </li>
                ))}
                {filteredFlipkartBrands.length === 0 && (
                  <li className="py-2 text-center text-gray-500">No brands available</li>
                )}
              </ul>
            </div>
            <div>
              <h2 className="font-semibold mb-2">
                Amazon Brands ({filteredAmazonBrands.length})
                {hideGroupedBrands && amazonBrands.length > filteredAmazonBrands.length && 
                  ` (${amazonBrands.length - filteredAmazonBrands.length} hidden)`
                }
              </h2>
              <ul className="h-96 overflow-auto border rounded p-2">
                {filteredAmazonBrands.map(b => (
                  <li
                    key={b.id}
                    className={`cursor-pointer px-2 py-1 rounded ${selected.find(x => x.id === b.id && x.source === "amazon") ? "bg-green-100 dark:bg-green-900" : ""}`}
                    onClick={() => handleSelect(b, "amazon")}
                  >
                    {b.name} <span className="text-xs text-gray-400">({b.product_count})</span>
                  </li>
                ))}
                {filteredAmazonBrands.length === 0 && (
                  <li className="py-2 text-center text-gray-500">No brands available</li>
                )}
              </ul>
            </div>
          </div>
          <div className="mt-8">
            <h2 className="font-semibold mb-2">Fuzzy Match Results ({matches.length})</h2>
            {matches.length === 0 ? (
              <div className="border rounded p-4 text-center text-gray-500">
                No matches found. Click "Run Fuzzy Match" to find potential brand matches.
              </div>
            ) : (
              <ul className="h-64 overflow-auto border rounded p-2">
                {matches.map((m, i) => (
                  <li key={i} className="py-1 border-b last:border-b-0 flex items-center">
                    <div className="flex-1">
                      <span className="font-mono">{m.brand1.name}</span> ↔ <span className="font-mono">{m.brand2.name}</span>
                      <span className="ml-2 text-xs text-gray-400">Score: {m.score}</span>
                    </div>
                    <button 
                      className="text-blue-500 hover:text-blue-700 text-sm px-2"
                      onClick={() => {
                        setSelected([
                          { ...m.brand1, source: "flipkart" },
                          { ...m.brand2, source: "amazon" }
                        ]);
                        showNotification("Brands selected for grouping", "info");
                      }}
                    >
                      Select
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : (
        <div>
          <h2 className="font-semibold mb-4">Brand Groups ({brandGroups.length})</h2>
          {brandGroups.length === 0 ? (
            <div className="text-center py-8 border rounded">
              <p className="text-gray-500">No brand groups found. Create some by matching brands.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {brandGroups.map(group => (
                <div key={group.id} className="border rounded p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-lg">{group.canonical_name}</h3>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => deleteGroup(group.id, group.canonical_name)}
                      disabled={deleteLoading}
                    >
                      Delete
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-1">Flipkart Brands</h4>
                      <ul className="text-sm">
                        {group.members.filter(m => m.source === 'flipkart').map(member => (
                          <li key={member.id} className="py-1">{member.brand_name}</li>
                        ))}
                        {group.members.filter(m => m.source === 'flipkart').length === 0 && (
                          <li className="py-1 text-gray-400">No Flipkart brands</li>
                        )}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-1">Amazon Brands</h4>
                      <ul className="text-sm">
                        {group.members.filter(m => m.source === 'amazon').map(member => (
                          <li key={member.id} className="py-1">{member.brand_name}</li>
                        ))}
                        {group.members.filter(m => m.source === 'amazon').length === 0 && (
                          <li className="py-1 text-gray-400">No Amazon brands</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showGroupModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 p-6 rounded shadow-lg min-w-[320px]">
            <h3 className="font-semibold mb-2">Set Canonical Brand Name</h3>
            <input
              className="border rounded px-2 py-1 w-full mb-4"
              value={canonicalName}
              onChange={e => setCanonicalName(e.target.value)}
            />
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-1">Selected Brands:</h4>
              <ul className="text-sm max-h-40 overflow-auto">
                {selected.map((brand, index) => (
                  <li key={index} className="py-1">
                    {brand.name} <span className="text-xs text-gray-400">({brand.source})</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowGroupModal(false)}>Cancel</Button>
              <Button onClick={saveGroup}>Save Group</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
