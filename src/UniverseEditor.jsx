
   /* [FOOTBALL COACH: COLLEGE DYNASTY] - CUSTOM UNIVERSE EDITOR ***/
  /** [By]: JT Taylor *********************************************/
 /*** [Version]: 0.1.18 ******************************************/
/**** [Dependencies]: Vite, React, Tailwinds CSS ****************/

import React, { useEffect, useMemo, useRef, useState } from "react";


/*** Master Validation Function that includes scroll targets. Returns [{ message, targetId }]. ***/

function validateUniverseDetailed(universe) 
{
  if (!universe) return [];
  const errors = [];
  const conferences = Array.isArray(universe.conferences) ? universe.conferences : [];
  const bowlGames = Array.isArray(universe.bowlGames) ? universe.bowlGames : [];

    // Conference count Validation
  const confCount = conferences.length;
  if (![6, 8, 10].includes(confCount)) 
  {
    errors.push({
      message: "Universe must have exactly 6, 8, or 10 conferences.",
      targetId: "section-conferences"});
  }

    // Unique Conference prestige level Validation
  const prestigeLevels = conferences
    .map((c) => c?.prestigeLevel)
    .filter((v) => v !== undefined);
  const uniquePrestige = new Set(prestigeLevels);
  if (prestigeLevels.length !== uniquePrestige.size) 
  {
    errors.push({
      message: "Each conference must have a unique prestigeLevel.",
      targetId: "section-conferences"});
  }

    // Collect all team abbreviations (global)
  const teamAbbrevs = [];
  conferences.forEach((conf) =>
    (conf?.divisions || []).forEach((div) =>
      (div?.teams || []).forEach((t) => teamAbbrevs.push(t?.abbreviation))
    )
  );
  const cleanedAbbrevs = teamAbbrevs.filter(Boolean);
  const globalAbbrevSet = new Set(cleanedAbbrevs);

    // Check for Duplicate abbreviations
  const dupes = cleanedAbbrevs.filter((v, i, a) => a.indexOf(v) !== i);
  if (dupes.length) 
  {
    errors.push({
      message: `Duplicate team abbreviations found: ${[...new Set(dupes)].join(", ")}`,
      targetId: "section-conferences"});
  }

    // Conference format rules + rivals
  conferences.forEach((conf, cIdx) => 
  {
    const confId = `conf-${cIdx}`;
    const divisions = Array.isArray(conf?.divisions) ? conf.divisions : [];
    const divCount = divisions.length;
    const teamCounts = divisions.map((d) => (Array.isArray(d?.teams) ? d.teams.length : 0));

    // Division format validation
    const valid =
      (divCount === 1 && teamCounts[0] === 10) ||
      (divCount === 2 && teamCounts.every((c) => [6, 7, 9].includes(c))) ||
      (divCount === 4 && teamCounts.every((c) => [4, 5].includes(c)));

    if (!valid) 
    {
      errors.push({
        message: `Conference '${conf?.name ?? "(unnamed)"}' has an invalid division/team structure.`,
        targetId: confId
      });
    }

    // Division format rules + rivals
    divisions.forEach((div, dIdx) => 
    {
      const divId = `div-${cIdx}-${dIdx}`;
      const divisionTeams = Array.isArray(div?.teams) ? div.teams : [];
      const divisionAbbrevs = new Set(divisionTeams.map((t) => t?.abbreviation).filter(Boolean));

      divisionTeams.forEach((team, tIdx) => 
      {
        const teamId = `team-${cIdx}-${dIdx}-${tIdx}`;
        const tAbbr = String(team?.abbreviation ?? "").trim();
        const teamLabel = tAbbr || "(no abbr)";
        const rival = String(team?.rivalAbbreviation ?? "").trim();
        const archetype = String(team?.archetype ?? "").trim();
        const fanbaseType = String(team?.fanbaseType ?? "").trim();

        // REQUIRED: archetype
        if (!archetype) 
        {
          errors.push({
           message: `Team '${teamLabel}' archetype is required.`,
           targetId: teamId
          });
        }

        // REQUIRED: fanbaseType
        if (!fanbaseType) 
        {
        errors.push({
        message: `Team '${teamLabel}' fanbaseType is required.`,
        targetId: teamId
            });
        }

        // REQUIRED: rivalAbbreviation
        if (!rival) 
        {
        errors.push({
        message: `Team '${teamLabel}' rivalAbbreviation is required.`,
        targetId: teamId
        });
        } else {
        // Rival must exist globally
        if (!globalAbbrevSet.has(rival)) {
         errors.push({
        message: `Team '${teamLabel}' has invalid rival '${rival}'.`,
        targetId: teamId
        });
        } else {
        // Rival must be in same division
        if (!divisionAbbrevs.has(rival)) {
        errors.push({
        message: `Team '${teamLabel}' rival '${rival}' must be in the same division.`,
        targetId: divId
        });
        }
        }
    }
        
        
      });
      
    });
    
  });

    // Bowl validation (+ optional tie-in)
    bowlGames.forEach((b, i) => 
    {
        const bowlId = `bowl-${i}`;

        if (!b || typeof b !== "object") 
        {
        errors.push({ message: `Bowl game at index ${i} is invalid.`, targetId: bowlId });
        return;
        }

        if (typeof b.name !== "string" || !b.name.trim()) 
        {
        errors.push({ message: `Bowl game at index ${i} must have a name.`, targetId: bowlId });
        }

        if (typeof b.zipcode !== "string" || !/^[0-9]{5}$/.test(b.zipcode)) 
        {
        errors.push({
        message: `Bowl game '${b.name ?? `#${i}`}' must have a 5-digit zipcode.`,
        targetId: bowlId
        });
        }

  // Bowl Game tie-in validation
  if (b.tieIn != null) {
    if (typeof b.tieIn !== "object" || Array.isArray(b.tieIn)) {
      errors.push({
        message: `Bowl game '${b.name ?? `#${i}`}' tieIn must be an object.`,
        targetId: bowlId
      });
    } else {
      const firstRaw = b.tieIn.first;
      const secondRaw = b.tieIn.second;

      const normalizeToList = (v) => {
        if (v == null) return [];
        if (typeof v === "string") return [v];
        if (Array.isArray(v)) return v;
        return ["__invalid_type__"];
      };

      const firstListRaw = normalizeToList(firstRaw);
      const secondListRaw = normalizeToList(secondRaw);

      // type checks
      if (firstListRaw.includes("__invalid_type__")) {
        errors.push({
          message: `Bowl game '${b.name ?? `#${i}`}' tieIn.first must be a string or an array of strings.`,
          targetId: bowlId
        });
      }
      if (secondListRaw.includes("__invalid_type__")) {
        errors.push({
          message: `Bowl game '${b.name ?? `#${i}`}' tieIn.second must be a string or an array of strings (or omitted).`,
          targetId: bowlId
        });
      }

      const firstList = firstListRaw
        .filter((x) => x !== "__invalid_type__")
        .map((x) => String(x ?? "").trim())
        .filter(Boolean);

      const secondList = secondListRaw
        .filter((x) => x !== "__invalid_type__")
        .map((x) => String(x ?? "").trim())
        .filter(Boolean);

      // first is required when tieIn exists
      if (firstList.length === 0) {
        errors.push({
          message: `Bowl game '${b.name ?? `#${i}`}' tieIn.first is required when tie-in is enabled.`,
          targetId: bowlId
        });
      }

      // max 5 per side
      if (firstList.length > 5) {
        errors.push({
          message: `Bowl game '${b.name ?? `#${i}`}' tieIn.first can have at most 5 conferences.`,
          targetId: bowlId
        });
      }
      if (secondList.length > 5) {
        errors.push({
          message: `Bowl game '${b.name ?? `#${i}`}' tieIn.second can have at most 5 conferences.`,
          targetId: bowlId
        });
      }

      // existence checks
      firstList.slice(0, 5).forEach((confName, idx) => {
        if (!conferences.some((c) => c?.name === confName)) {
          errors.push({
            message: `Bowl game '${b.name ?? `#${i}`}' tieIn.first #${idx + 1} conference '${confName}' does not exist.`,
            targetId: bowlId
          });
        }
      });

      secondList.slice(0, 5).forEach((confName, idx) => {
        if (!conferences.some((c) => c?.name === confName)) {
          errors.push({
            message: `Bowl game '${b.name ?? `#${i}`}' tieIn.second #${idx + 1} conference '${confName}' does not exist.`,
            targetId: bowlId
          });
        }
      });
    }
  }
});

return errors;
  
}   /*** END OF [validateUniverseDetailed] FUNCTION ***/


/*** Validation Self Test Function ***/
function runValidationSelfTestsOnce() 
{
  try 
  {
    const u = {
      name: "Test",
      startingYear: 2025,
      bowlGames: [{ name: "Rose", zipcode: "00000" }],
      conferences: Array.from({ length: 6 }, (_, i) => ({
        name: `C${i + 1}`,
        prestigeLevel: i + 1,
        zipcode: "00000",
        divisions: [
          {
            name: "D1",
            teams: Array.from({ length: 10 }, (__, t) => ({
              abbreviation: `T${i}${t}`,
              name: `Team ${i}-${t}`,
              mascot: "Mascot",
              primaryColor: "#000000",
              secondaryColor: "#ffffff",
              zipcode: "00000",
              attributes: 
              {
                stadium: 1,
                facilities: 1,
                collegeLife: 1,
                academics: 1,
                marketing: 1,
                prestige: 1,
                attendance: 0,
                fanbaseLevel: 1
              },
              archetype: "balanced",
              fanbaseType: "reasonable",
              rivalAbbreviation: ""
            }))
          }
        ]
      }))
    };

    const errs0 = validateUniverseDetailed(u);
    console.assert(errs0.some((e) => e.message.includes("5-digit zipcode")), "Expected bowl zipcode validation error");

    const u2 = { ...u, conferences: u.conferences.slice(0, 7) };
    console.assert(
      validateUniverseDetailed(u2).some((e) => e.message.includes("6, 8, or 10")),
      "Expected conference count error"
    );

    const u3 = structuredClone(u);
    u3.bowlGames[0].zipcode = "91103";
    u3.conferences[0].divisions = [
      { name: "A", teams: u3.conferences[0].divisions[0].teams.slice(0, 5) },
      { name: "B", teams: u3.conferences[0].divisions[0].teams.slice(5, 10) }
    ];
    u3.conferences[0].divisions[0].teams[0].rivalAbbreviation = u3.conferences[0].divisions[1].teams[0].abbreviation;
    console.assert(
      validateUniverseDetailed(u3).some((e) => e.message.includes("same division")),
      "Expected rival-in-division error"
    );

    const u4 = structuredClone(u);
    u4.bowlGames = [{ name: "Lilac Bowl", zipcode: "91103", tieIn: { first: "C1", second: "NOPE" } }];
    console.assert(
      validateUniverseDetailed(u4).some((e) => e.message.includes("does not exist")),
      "Expected tie-in conference existence error"
    );

    // New self-test: tie-in same conference
    const u5 = structuredClone(u);
    u5.bowlGames = [{ name: "Mirror Bowl", zipcode: "91103", tieIn: { first: "C1", second: "C1" } }];
    console.assert(
      validateUniverseDetailed(u5).some((e) => e.message.includes("cannot use the same conference")),
      "Expected tie-in same-conf error"
    );
  }
   
  catch (e) 
    {
    console.warn("Validation self-tests encountered an error:", e);
    }
    
}   /*** END OF [runValidationSelfTestsOnce] FUNCTION ***/



// Gets the Full Team name and Abbreviation
function getTeamDisplayName(team) 
{
  const name = (team?.name ?? "").trim();
  const mascot = (team?.mascot ?? "").trim();
  const abbr = (team?.abbreviation ?? "").trim();
  const fullName = `${name} ${mascot}`.trim();

  if (fullName && abbr) return `${fullName} (${abbr})`;
  if (fullName) return fullName;
  if (abbr) return abbr;
  return "(unnamed team)";
}

// Default Function [UniverseEditor()]
export default function UniverseEditor() 
{
    const [universe, setUniverse] = useState(null);
    const [flashTargetId, setFlashTargetId] = useState(null);
    const [collapsedTeams, setCollapsedTeams] = useState({});
    const [activeTeamKey, setActiveTeamKey] = useState(null);
    
 // Safe Destructive Actions (2-click confirm)
    const [armedDeleteKey, setArmedDeleteKey] = useState(null);

    function confirmThen(actionKey, actionFn, timeoutMs = 5500) 
    {
        if (armedDeleteKey === actionKey) 
        {
        setArmedDeleteKey(null);
        actionFn();
        return;
        }

        setArmedDeleteKey((prev) => (prev === actionKey ? prev : actionKey));

        window.setTimeout(() => {
        setArmedDeleteKey((prev) => (prev === actionKey ? null : prev));
            }, timeoutMs);
    }

    const armedRemoveBtn = "px-2 py-1 rounded bg-rose-700 text-white hover:bg-rose-500";

    const teamKey = (cIdx, dIdx, tIdx) => `team-${cIdx}-${dIdx}-${tIdx}`;

    function isTeamCollapsed(cIdx, dIdx, tIdx) 
    {
        return !!collapsedTeams[teamKey(cIdx, dIdx, tIdx)];
    }

    function toggleTeamCollapsed(cIdx, dIdx, tIdx) 
    {
        const key = teamKey(cIdx, dIdx, tIdx);
        setCollapsedTeams((prev) => ({ ...prev, [key]: !prev[key] }));
    }

    function setDivisionTeamsCollapsed(cIdx, dIdx, collapsed, keepActiveOpen = true) 
    {
        const teams = Array.isArray(universe?.conferences?.[cIdx]?.divisions?.[dIdx]?.teams)
        ? universe.conferences[cIdx].divisions[dIdx].teams
        : [];

        setCollapsedTeams((prev) => {
        const next = { ...prev };

        const activePrefix = `team-${cIdx}-${dIdx}-`;
        const activeIsInThisDivision =
        keepActiveOpen && activeTeamKey && activeTeamKey.startsWith(activePrefix);

        teams.forEach((_, tIdx) => {
        const k = teamKey(cIdx, dIdx, tIdx);

      // If collapsing and the active team is in this division, keep it expanded
      if (collapsed && activeIsInThisDivision && k === activeTeamKey) {
        next[k] = false; // expanded
      } else {
        next[k] = collapsed;
      }
        });

        return next;
        });
    }


    function isDivisionAnyTeamExpanded(cIdx, dIdx) 
    {
        const teams = Array.isArray(universe?.conferences?.[cIdx]?.divisions?.[dIdx]?.teams)
        ? universe.conferences[cIdx].divisions[dIdx].teams
        : [];

        return teams.some((_, tIdx) => !isTeamCollapsed(cIdx, dIdx, tIdx));
    }

    const [zipInfoByZip, setZipInfoByZip] = useState({});
    const zipLookupCacheRef = useRef(new Map());
    const selfTestsRanRef = useRef(false);
    const isHex6 = (v) => /^#[0-9A-Fa-f]{6}$/.test(String(v ?? "").trim());
    const normalizeHex = (v) => 
    {
        const s = String(v ?? "").trim();
        if (!s) return "";
        return s.startsWith("#") ? s : `#${s}`;
    };

    const safeColorValue = (v) => (isHex6(v) ? v : "#000000");

    if (!selfTestsRanRef.current && typeof import.meta !== "undefined" && import.meta.env?.DEV) 
    {
        selfTestsRanRef.current = true;
        runValidationSelfTestsOnce();
    }

    // Function that scrolls to the part of the page that shows Validation error
    function scrollToTarget(targetId) 
    {
        if (!targetId) return;
        const el = document.getElementById(targetId);
        if (!el) return;

        setFlashTargetId(targetId);
        el.scrollIntoView({ behavior: "smooth", block: "center" });

        window.setTimeout(() => 
        {
        setFlashTargetId((prev) => (prev === targetId ? null : prev));
        }, 1200);
    }

    // Function that uploads JSON file
    function handleUpload(e) 
    {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => 
        {
            try 
            {
                const parsed = JSON.parse(String(reader.result ?? ""));
                setUniverse(parsed);
            } 
            
            catch 
            {
                alert("Invalid JSON file");
            }
        };
        reader.readAsText(file);
    }

// Function that updates JSON text/values
  function updateField(path, value) 
  {
    setUniverse((prev) => 
    {
      const clone = structuredClone(prev);
      let obj = clone;
      for (let i = 0; i < path.length - 1; i++) obj = obj[path[i]];
      obj[path[path.length - 1]] = value;
      return clone;
    });
  }

    // Function that DELETES JSON text/values
  function deleteField(path) 
  {
    setUniverse((prev) => 
    {
      const clone = structuredClone(prev);
      let obj = clone;
      for (let i = 0; i < path.length - 1; i++) obj = obj[path[i]];
      const key = path[path.length - 1];
      if (obj && typeof obj === "object") 
      {
        if (Object.prototype.hasOwnProperty.call(obj, key)) delete obj[key];
      }
      return clone;
    });
  }

    // Function that REMOVES JSON text/values
  function removeAt(pathToArray, idx) 
  {
    setUniverse((prev) => 
    {
      if (!prev) return prev;
      const clone = structuredClone(prev);
      let arr = clone;
      for (const key of pathToArray) arr = arr[key];
      arr.splice(idx, 1);
      return clone;
    });
  }

    // Function that INSERTS JSON text/values
  function insertAt(pathToArray, idx, item) {
    setUniverse((prev) => {
      const clone = structuredClone(prev);
      let arr = clone;
      for (const key of pathToArray) arr = arr[key];
      arr.splice(idx, 0, item);
      return clone;
    });
  }

    // Function that MOVES JSON text/values
  function moveItem(pathToArray, from, to) 
  {
    setUniverse((prev) => {
      const clone = structuredClone(prev);
      let arr = clone;
      for (const key of pathToArray) arr = arr[key];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return clone;
    });
  }

    // Only re-run Validation when data changes
  const validation = useMemo(() => validateUniverseDetailed(universe), [universe]);
  
    // Whenever the universe changes, build a clean list of conference names and cache it
  const conferenceNames = useMemo(
    () => (universe?.conferences || []).map((c) => c?.name).filter(Boolean),
    [universe]
  );
  
  // Zip Code Lookup and Configuration
  useEffect(() => {
  if (!universe) return;

    // Collect every valid ZIP code used anywhere
  const zips = new Set();

    // Bowl Zip Codes
  (universe.bowlGames || []).forEach((b) => {
    const z = String(b?.zipcode ?? "").trim();
    if (/^[0-9]{5}$/.test(z)) zips.add(z);
  });

    // Conference Zip Codes
  (universe.conferences || []).forEach((c) => {
    const z = String(c?.zipcode ?? "").trim();
    if (/^[0-9]{5}$/.test(z)) zips.add(z);
  });

    // Team Zip Codes
  (universe.conferences || []).forEach((c) =>
    (c?.divisions || []).forEach((d) =>
      (d?.teams || []).forEach((t) => {
        const z = String(t?.zipcode ?? "").trim();
        if (/^[0-9]{5}$/.test(z)) zips.add(z);
      })
    )
  );

  if (zips.size === 0) return;

  let cancelled = false;

    // If Zip Codes already cached, don't fetch
  async function fetchZip(zip) {
    if (zipLookupCacheRef.current.has(zip)) {
      const cached = zipLookupCacheRef.current.get(zip);
      setZipInfoByZip((prev) => (prev[zip] ? prev : { ...prev, [zip]: cached ?? { error: true } }));
      return;
    }
    // API call to zippopotam.us to fetch zip codes
    try {
      const res = await fetch(`https://api.zippopotam.us/us/${zip}`);
      if (!res.ok) throw new Error();

      const data = await res.json();
      const place = data?.places?.[0];

      const city = place?.["place name"]?.trim();
      const state = place?.["state abbreviation"]?.trim();

      const value = city && state ? { city, state } : null;
      zipLookupCacheRef.current.set(zip, value);

      if (!cancelled) {
        setZipInfoByZip((prev) => ({ ...prev, [zip]: value ?? { error: true } }));
      }
    } catch {
      zipLookupCacheRef.current.set(zip, null);
      if (!cancelled) {
        setZipInfoByZip((prev) => ({ ...prev, [zip]: { error: true } }));
      }
    }
  }

  zips.forEach((zip) => {
    if (!zipInfoByZip[zip]) fetchZip(zip);
  });

  return () => {
    cancelled = true;
  };
}, [universe, zipInfoByZip]);

// Copy JSON Function. Allow copy anytime; validation is advisory only.

    async function copyJsonToClipboard() 
    {
        if (!universe) return;

        try 
        {
            const json = JSON.stringify(universe, null, 2);
            if (navigator?.clipboard?.writeText) 
            {
            await navigator.clipboard.writeText(json);
            } 
        else 
        {
            const ta = document.createElement("textarea");
                ta.value = json;
                ta.style.position = "fixed";
                ta.style.left = "-9999px";
                ta.style.top = "0";
                document.body.appendChild(ta);
                ta.focus();
                ta.select();
                document.execCommand("copy");
                document.body.removeChild(ta);
        }
        
        alert("Copied JSON to clipboard.");
        } 
        
        catch (e) 
        {
        console.error("Copy failed:", e);
        alert("Copy failed. Your browser may be blocking clipboard access.");
        }
    }
    
// Download JSON Function.
    function downloadJsonFile() 
    {
        if (!universe) return;

        const json = JSON.stringify(universe, null, 2);

        // Filename formatting
        const rawName = String(universe?.name ?? "custom-universe").trim();
        const safeName =
            rawName
            .replace(/[^\w\s-]/g, "")   // remove weird chars
            .replace(/\s+/g, "-")       // spaces -> dashes
            .slice(0, 60)               // keep it reasonable
            || "custom-universe";

        const filename = `${safeName}.json`;

        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

        // Cleanup
        URL.revokeObjectURL(url);

    } /*** END OF [downloadJsonFile] FUNCTION ***/

    
  const defaultAttributes = {
    stadium: 1,
    facilities: 1,
    collegeLife: 1,
    academics: 1,
    marketing: 1,
    prestige: 1,
    attendance: 0,
    fanbaseLevel: 1
  };

  const makeDefaultTeam = () => ({
    abbreviation: "NEW",
    name: "New Team",
    mascot: "Mascot",
    primaryColor: "#000000",
    secondaryColor: "#ffffff",
    zipcode: "00000",
    attributes: { ...defaultAttributes },
    archetype: "balanced",
    fanbaseType: "reasonable",
    rivalAbbreviation: ""
  });

  const makeDefaultDivision = () => ({
    name: "New Division",
    teams: []
  });

  const makeDefaultConference = () => ({
    name: "New Conference",
    prestigeLevel: 1,
    zipcode: "00000",
    divisions: [makeDefaultDivision()]
  });

  const makeDefaultBowl = () => ({ name: "New Bowl", zipcode: "00000" });

  const flashClass = (id) => (id && flashTargetId === id ? "ring-2 ring-red-500" : "");

  const labelClass = "text-sm text-gray-700 opacity-100 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity";

    const addBtn = "px-3 py-2 shadow-lg rounded bg-emerald-700 text-white hover:bg-green-900";
    const removeBtn = "px-2 py-1 shadow-lg rounded bg-rose-700 text-white hover:bg-red-600";
    const neutralBtn = "px-2 py-1 shadow-lg border rounded bg-gray-200 hover:bg-gray-300";
    const pageClass = "bg-slate-50";
    const sectionCard = "bg-white border border-slate-200 rounded-lg shadow-sm";
    const subCard = "bg-slate-50 border border-slate-200 rounded-lg";
    const teamCard = "bg-white border border-slate-200 rounded-lg border-l-4 border-l-emerald-400";

    const inputClass =
  "border border-slate-300 p-2 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500";

    const selectClass =
  "border border-slate-300 p-2 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500";



// Render Full Webpage

    return (
    <div className={`${pageClass} p-6 max-w-5xl mx-auto space-y-4`}>

      
        {/* Webpage Header Labels */}
        <h1 className="font-mono-ui text-4xl font-bold text-gray-600 text-center"> 
        
        Football Coach: College Dynasty
        
        </h1>
    
        <h1 className="font-mono-ui mt-7 mb-15 text-2xl font-bold text-center"> 
        
        Custom Universe Editor
        
        </h1>
        
        
        {/* Browse JSON File Button */}
        <div className="space-y-2">
        <input
            type="file"
            accept="application/json"
            onChange={handleUpload}
            className="
                block w-full text-sm text-gray-700 text-center
                file:mr-1 
                file:py-2 
                file:px-4
                file:rounded
                file:border-0
                file:text-sm 
                
                file:bg-gray-500 
                file:text-white
                hover:file:bg-gray-700
                cursor-pointer"
        />
        
        <div className="mt-4 mb-7 text-xs text-gray-600 text-center">
        
            Upload an existing 'Football Coach: College Dynasty' Universe JSON File to Edit
        
        </div>
        
        <div className="flex items-center justify-between mt-4">
        {/* Discord Link */}
            <a
            href="https://discord.gg/Bdsy9bwcqP"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-4 py-2 rounded bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
            >
            Football Coach Official Discord
            </a>

        {/* Reddit Link */}
            <a
            href="https://www.reddit.com/r/FootballCoach/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-4 py-2 rounded bg-orange-600 text-white font-semibold hover:bg-orange-700 transition"
            >
            r/FootballCoach on Reddit
            </a>
            </div>
        
        {/* Custom League Universe requirements */}
        <section id="section-requirements" className={`border rounded p-4 group bg-amber-50`}>
         <div className="mt-2 mb-10 text-2xl font-mono-ui font-semibold text-gray-500 text-center"> 
        Custom League Universe requirements:
        </div>
        <div className="mt-1 text-sm font-semibold text-gray-600 text-left"> 
        - Custom Universe Must be a JSON file.
        </div>
        
        <div className="mt-3 text-sm font-semibold text-gray-600 text-left"> 
        - Custom Universe Requires: 
        </div>
        <div className="mt-1 pl-4 text-sm text-gray-600">
        - 'name' (Custom Universe Name), 'startingYear', 'startingMessage', 'conferences', and 'bowlGames' at the top level.
        </div>
         <div className="mt-1 pl-4 text-sm text-gray-600"> 
        - Exactly 6, 8, or 10 conferences, each with a different prestige level (required for realignment).
        </div>
        
        <div className="mt-3 text-sm font-semibold text-gray-600 text-left"> 
        - Bowl Games Require:
        </div>
        <div className="mt-1 pl-4 text-sm text-gray-600">
        - 'name'and 'zipcode' (where Bowl Games are played). 
        </div>
        <div className="mt-1 pl-4 text-sm text-gray-600"> 
        - Bowl Games should be ordered by importance
        </div>
        <div className="mt-1 pl-4 text-sm text-gray-600"> 
        - Bowl Game Tie-In's are Optional
        </div>

        
        
        <div className="mt-3 text-sm text-gray-600 font-semibold text-left"> 
        - Each Conference Requires:         
        </div>
        <div className="mt-1 pl-4 text-sm text-gray-600"> 
        - 'name' (Conference Name), 'prestigeLevel' (1 - 10), 'zipcode' (Where Conf Championship Game is played), and 'divisions'
        </div>
        
        
        <div className="mt-3 text-sm text-gray-600 font-semibold text-left"> 
        - Each Conference's Divisions must be:
        </div>
        <div className="mt-1 pl-4 text-sm text-gray-600"> 
        - [Single Division of 10 Teams] or
        </div>
        <div className="mt-1 pl-4 text-sm text-gray-600"> 
        - [2 Divisions, each with 6 or 7 or 9 teams] or
        </div>
        <div className="mt-1 pl-4 text-sm text-gray-600"> 
        - [4 divisions, each with 4 or 5 teams]
        </div>
        
        
        <div className="mt-3 text-sm text-gray-600 font-semibold text-left"> 
        - Each Division Requires:  
        </div>
        <div className="mt-1 pl-4 text-sm text-gray-600"> 
        - 'name' and 'teams' (Even if there is only 1 Division)
        </div>
        
        
        <div className="mt-3 text-sm text-gray-600 font-semibold text-left"> 
        - Each Team Requires:
        </div>
        <div className="mt-1 pl-4 text-sm text-gray-600"> 
        - 'name', 'mascot', 'abbreviation', 'rivalAbbreviation', 'primaryColor', 'secondaryColor', 'zipcode', 'attributes', 'fanbaseType', 'archetype'
        </div>
        <div className="mt-1 pl-4 text-sm text-gray-600"> 
        - Team Abbreviations must be unique, and rivalAbbreviation must exist in the same division.
        </div>
        

        <div className="mt-3 text-sm text-gray-600 font-semibold text-left"> 
        - Team Attributes include:         
        </div>
        <div className="mt-1 pl-4 text-sm text-gray-600"> 
        - 'prestige', 'facilities', 'stadium', 'collegeLife', 'academics', 'marketing', 'fanbaseLevel', and 'attendance'
        </div>
        <div className="mt-1 pl-4 text-sm text-gray-600"> 
        - All Attributes except 'attendance' are on a 1 - 10 scale, 'attendance' is just number of students (i.e. 45000)
        </div>
        
        </section>
         <div className="mt-10 text-base font-semibold text-gray-600 text-center"> 
        The Custom Universe Editor will validate the requirements and display an error below if criteria is not met:
        </div>
        
        </div>

        {/* Validation ALERT/ERROR Configuration */}
        {universe && (
        <>
          {validation.length > 0 ? (
            <div className="border border-red-500 bg-red-50 p-4 rounded">
              <h2 className="font-bold text-red-700 mb-2 text-center">Issues to Fix Before Copy/Download</h2>
              <ul className="list-disc list-inside text-red-600 space-y-1">
                {validation.map((err, i) => (
                  <li key={i}>
                    <button type="button" className="underline text-left" onClick={() => scrollToTarget(err.targetId)}>
                      {err.message}
                    </button>
                  </li>
                ))}
              </ul>
              <div className="text-xs text-red-700 mt-2">
                Editing is always allowed. You can still copy, but the game may reject invalid JSON.
              </div>
            </div>
          ) : (
            <div className="border border-green-500 bg-green-50 p-4 rounded">
              <div className="font-bold text-green-700">Universe is valid and ready to copy.</div>
            </div>
          )}


        {/* Copy JSON Button and Download JSON Button'TOP' */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
        <button
            type="button"
            onClick={copyJsonToClipboard}
            className="px-4 py-3 rounded text-lg bg-black text-white hover:bg-gray-700 disabled:bg-gray-300"
            disabled={!universe}
            >
            Copy JSON to Clipboard
        </button>

        <button
            type="button"
            onClick={downloadJsonFile}
            className="px-4 py-3 rounded text-lg bg-slate-500 text-white hover:bg-gray-700 disabled:bg-gray-300"
            disabled={!universe}
            >
            Download JSON File
        </button>
        </div>




    {/* UNIVERSE Section */}
    
        <section id="section-universe" className={`border rounded p-4 group bg-gray-300 shadow-lg ${flashClass("section-universe")}`}>
        
        <h2 className="text-xl font-bold text-gray-600 mb-6">
        
        UNIVERSE
        
        </h2>
        
        <div className="grid grid-cols-2 gap-4">
                
            <div className="space-y-1">
                <label className="block text-sm">Custom Universe Name</label>
                <input
                  className="border p-2 w-full bg-white"
                  value={universe.name ?? ""}
                  onChange={(e) => updateField(["name"], e.target.value)}
                />
              </div>

            <div className="space-y-1">
                <label className="block text-sm">Starting Year</label>
                <input
                  type="number"
                  className="border p-2 w-full bg-white"
                  value={universe.startingYear ?? 0}
                  onChange={(e) => updateField(["startingYear"], parseInt(e.target.value, 10) || 0)}
                />
              </div>
              
            <div className="space-y-1 col-span-2">
                <label className="block text-sm">Starting Message</label>
                <textarea
                    className="border p-2 w-full bg-white"
                    rows={2}
                    value={universe.startingMessage ?? ""}
                    onChange={(e) => updateField(["startingMessage"], e.target.value)}
                    placeholder='Custom Universe with a mix of FBS and FCS teams'
                />
            </div>
              
            </div>
          </section>
          

    {/* BOWL GAMES */}  {/* BOWL Section */}
        
          <section id="section-bowls" className={`border rounded p-4 group bg-gray-300 shadow-lg ${flashClass("section-bowls")}`}>
            <div className="flex items-center justify-between gap-4 mb-5">
            
              <h2 className="text-xl font-bold text-gray-600">
              
            BOWL GAMES
              
              </h2>
              
              <div className="mt-5 text-sm text-gray-500"> 
              
            Bowl Games ordered by importance
              
            </div>
            
              <button
                type="button"
                className={addBtn}
                onClick={() => insertAt(["bowlGames"], universe.bowlGames?.length ?? 0, makeDefaultBowl())}>
                
            + Add Bowl
                
              </button>
            </div>
            
    {/* BOWL GAMES */}  {/* Bowl Game Re-order [↑ ↓] and [Remove] Buttons */}
            <div className="mt-3 space-y-3">
              {(universe.bowlGames || []).map((bowl, i) => (
                <div id={`bowl-${i}`} key={i} className={`border rounded p-3 group bg-slate-200 ${flashClass(`bowl-${i}`)}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold">#{i + 1}</div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className={`${neutralBtn} disabled:opacity-50`}
                        disabled={i === 0}
                        onClick={() => moveItem(["bowlGames"], i, i - 1)}>
                        ↑
                      </button>
                      <button
                        type="button"
                        className={`${neutralBtn} disabled:opacity-50`}
                        disabled={i === (universe.bowlGames?.length ?? 1) - 1}
                        onClick={() => moveItem(["bowlGames"], i, i + 1)}>
                        ↓
                      </button>
                      
                      
                     {(() => {
                    const deleteKey = `delete-bowl-${i}`;
                    const armed = armedDeleteKey === deleteKey;

                    return (
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        className={armed ? armedRemoveBtn : removeBtn}
                        title={armed ? "Click again to confirm delete" : "Remove bowl"}
                        onClick={() => confirmThen(deleteKey, () => removeAt(["bowlGames"], i))}
                        >
                            {armed ? "Confirm Remove" : "Remove"}
                    </button>

                        {armed && (
                    <button
                        type="button"
                        className={neutralBtn}
                        onClick={() => setArmedDeleteKey(null)}
                        title="Cancel"
                        >
                            Cancel
                    </button>
                        )}
                    </div>
                        );
                        })()} 
                    </div>
                </div>

    {/* BOWL GAMES */}  {/* Bowl Game Input Labels */}
            <div className="grid grid-cols-2 gap-2 mt-3">
            <div className={labelClass}>Bowl Name</div>
            <div className={labelClass}>Zip Code</div>

    {/* BOWL GAMES */}  {/* Bowl Name */}
            <input
            className="border p-2 font-normal bg-white"
            value={bowl?.name ?? ""}
            onChange={(e) => updateField(["bowlGames", i, "name"], e.target.value)}
            placeholder="Bowl name"
            />

    {/* BOWL GAMES */}  {/* Zip + City/State stacked in same grid cell */}
            <div className="space-y-1">
            <input
            className="border p-2 font-normal bg-white w-full"
            value={bowl?.zipcode ?? ""}
            onChange={(e) => updateField(["bowlGames", i, "zipcode"], e.target.value)}
            placeholder="Zipcode (5 digits)"
            />
            </div>
            
             <div className="col-start-2  text-xs">
                        {(() => {
                        const zip = String(bowl?.zipcode ?? "").trim();
                        if (!/^[0-9]{5}$/.test(zip)) return null;

                        const info = zipInfoByZip[zip];
                        if (!info) 
                        return <span className="text-gray-500">Looking up city/state…</span>;
                        if (info.error) 
                        return <span className="text-rose-700">City/state not found.</span>;

                        return <span className="text-gray-700">{info.city}, {info.state}</span>;
                        })()}
                    </div>
            </div>
            

   
    {/* BOWL GAMES */}  {/* Bowl Game Tie-in (optional; first required; up to 5 each side) */}
        <div className="mt-3 border-t pt-3">
        {(() => {
        const tieInObj = bowl?.tieIn && typeof bowl.tieIn === "object" ? bowl.tieIn : null;

        const toList = (v) => {
        if (typeof v === "string") return [v];
        if (Array.isArray(v)) return v.slice();
        return [];
        };

        const firstList = toList(tieInObj?.first);
        const secondList = toList(tieInObj?.second);

        const writeTieIn = (nextFirst, nextSecond) => {
        // keep blanks so the UI can render extra rows
        const fRaw = nextFirst.map((x) => String(x ?? "").trim()).slice(0, 5);
        const sRaw = nextSecond.map((x) => String(x ?? "").trim()).slice(0, 5);

        // used for deciding whether tie-in is "present"
        const fNonEmpty = fRaw.filter(Boolean);
        const sNonEmpty = sRaw.filter(Boolean);

        // If tie-in enabled, keep at least one slot
        if (fRaw.length === 0) {
        updateField(["bowlGames", i, "tieIn"], { first: "" });
        return;
        }

        const out = {};

        // Store as string only if there's exactly one slot AND it's filled.
        // Otherwise store array (including blanks) so extra rows stay visible.
        if (fRaw.length === 1 && fNonEmpty.length === 1) out.first = fNonEmpty[0];
        else out.first = fRaw;

        // second: omit if totally empty (meaning “any conference”)
        if (sNonEmpty.length === 1 && sRaw.length === 1) out.second = sNonEmpty[0];
        else if (sNonEmpty.length > 0 || sRaw.length > 1) out.second = sRaw;

        updateField(["bowlGames", i, "tieIn"], out);
         };


        const enabled = !!tieInObj;

        return (
        <>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => {
              const on = e.target.checked;
              if (on) {
                // Start with 1 required "first" slot
                updateField(["bowlGames", i, "tieIn"], { first: "" });
              } else {
                deleteField(["bowlGames", i, "tieIn"]);
              }
            }}
            />
          
          Enable Bowl Tie-In (up to 5 options per slot)
          
            </label>

            {enabled && (
          <div className="mt-2 space-y-3">
            {/* headers */}
            <div className="grid grid-cols-2 gap-2">
              <div className={labelClass}>First Conference (required)</div>
              <div className={labelClass}>Second Conference (optional)</div>
            </div>

            {/* rows */}
            {Array.from({ length: Math.max(firstList.length || 1, secondList.length || 1) }).map((_, idx) => {
              const firstVal = firstList[idx] ?? "";
              const secondVal = secondList[idx] ?? "";

              return (
                <div key={idx} className="grid grid-cols-2 gap-2 items-center">
                  <select
                    className="border p-2 bg-slate-100"
                    value={firstVal}
                    onChange={(e) => {
                      const nextFirst = firstList.slice();
                      while (nextFirst.length < idx + 1) nextFirst.push("");
                      nextFirst[idx] = e.target.value;

                      writeTieIn(nextFirst, secondList);
                    }}
                  >
                    <option value="" disabled>(select)</option>
                    {conferenceNames.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>

                  <div className="flex gap-2 items-center">
                    <select
                      className="border p-2 bg-slate-100 w-full"
                      value={secondVal}
                      onChange={(e) => {
                        const nextSecond = secondList.slice();
                        while (nextSecond.length < idx + 1) nextSecond.push("");
                        nextSecond[idx] = e.target.value;

                        writeTieIn(firstList.length ? firstList : [""], nextSecond);
                      }}
                    >
                      <option value="">(any conference)</option>
                      {conferenceNames.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>

                   
                    <button
                      type="button"
                      className={`${neutralBtn} disabled:opacity-50`}
                      disabled={Math.max(firstList.length || 1, secondList.length || 1) <= 1}
                      onClick={() => {
                        const nextFirst = firstList.slice();
                        const nextSecond = secondList.slice();
                        nextFirst.splice(idx, 1);
                        nextSecond.splice(idx, 1);

                        // if removing leaves first empty, keep one blank slot
                        if (nextFirst.length === 0) writeTieIn([""], nextSecond);
                        else writeTieIn(nextFirst, nextSecond);
                      }}
                      title="Remove tie-in option"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Add another tie-in row (up to 5 total) */}
            <button
              type="button"
              className={`${addBtn} disabled:opacity-50`}
              disabled={Math.max(firstList.length || 1, secondList.length || 1) >= 5}
              onClick={() => {
                const nextFirst = firstList.slice();
                const nextSecond = secondList.slice();

                // add a new row (blank first required; second optional)
                nextFirst.push("");
                // keep second aligned; optional
                if (nextSecond.length < nextFirst.length) nextSecond.push("");

                writeTieIn(nextFirst, nextSecond);
              }}
            >
              + Add Additional Tie-In
            </button>

            <div className="text-xs text-gray-500">
              Tip: Leave “Second Conference” as “(any conference)” to guarantee only the first slot.
            </div>
          </div>
            )}
            </>
            );
            })()}
        </div>  
                </div>

              ))}
            </div>
          </section>

    {/* CONFERENCE | DIVISIONS | TEAMS Section */}
        
    <section className={`border rounded p-4 bg-gray-300 shadow-lg ${flashClass("section-conferences")}`}>
        <div id="section-conferences" className="flex items-center justify-between gap-4">
        
            <h2 className="text-xl font-bold text-gray-600">
              
                CONFERENCES
                
            </h2>
              
    {/* CONFERENCE */}  {/* [+Add Conference] Button */}
    
                <button type="button"
                className={addBtn}
                onClick={() => insertAt(["conferences"], universe.conferences?.length ?? 0, makeDefaultConference())}
                >
                    + Add Conference
                    
                </button>   
        </div>
            
    {/* CONFERENCE */}  {/* Conference Border/Box */}
            <div className="mt-4 space-y-4">
              {(universe.conferences || []).map((conf, cIdx) => (
                <div id={`conf-${cIdx}`} key={cIdx} className={`border rounded shadow-lg p-4 bg-gray-400 group ${flashClass(`conf-${cIdx}`)}`}>
                <div className="flex items-center justify-between gap-2">
                    <div className="text-xl mb-3 font-semibold text-shadow-md/50 text-gray-200">
                    
                        #{cIdx + 1}
                        
                    <span className="text-transparent text-shadow-none"> 
                     
                        Conference  </span> 
                     
                    </div>
                    
    {/* CONFERENCE */}  {/* Conference Header */}               
                    <div className="text-2xl font-semibold text-gray-200  text-shadow-md/50 mb-3">
                            
                        {(conf?.name ?? "Unnamed Conference")} Conference </div>
                        
    {/* CONFERENCE */}  {/* Remove Conference Button */}                    
                            
{(() => {
  const deleteKey = `delete-conf-${cIdx}`;
  const armed = armedDeleteKey === deleteKey;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className={armed ? armedRemoveBtn : removeBtn}
        title={armed ? "Click again to confirm delete" : "Remove conference"}
        onClick={() =>
          confirmThen(deleteKey, () => removeAt(["conferences"], cIdx))
        }
      >
        {armed ? "Confirm Remove" : "Remove Conference"}
      </button>

      {armed && (
        <button
          type="button"
          className={neutralBtn}
          onClick={() => setArmedDeleteKey(null)}
          title="Cancel"
        >
          Cancel
        </button>
      )}
    </div>
  );
})()}
  
                </div>

    {/* CONFERENCE */} {/* Conference field labels */}
                  <div className="grid grid-cols-3 gap-2 mt-6">
                    <div className={labelClass}>Conference Name</div>
                    <div className={labelClass}>Conference Prestige</div>
                    <div className={labelClass}>Zip Code</div>
                  </div>

    {/* CONFERENCE */}  {/* Conference fields */}
            <div className="grid grid-cols-3 gap-2 mt-1">
                    <input
                      className="border p-2 bg-white"
                      value={conf?.name ?? ""}
                      onChange={(e) => updateField(["conferences", cIdx, "name"], e.target.value)}
                            placeholder="Conference name"
                    />
                    
                    <input
                      type="number"
                        min={1}
                        max={10}
                      className="border p-2 bg-white"
                      value={conf?.prestigeLevel ?? 1}
                      onChange={(e) => updateField(["conferences", cIdx, "prestigeLevel"], parseInt(e.target.value, 10) || 1)}
                            placeholder="Prestige"
                    />
                    
                    <input
                        className="border p-2 bg-white w-full"
                            value={conf?.zipcode ?? ""}
                            onChange={(e) => updateField(["conferences", cIdx, "zipcode"], e.target.value)}
                            placeholder="Zipcode"
                    />
                    
    {/* CONFERENCE */}  {/* City,State under Conference Zip Code */}
                    <div className="col-start-3 -mt-1 text-xs">
                        {(() => {
                        const zip = String(conf?.zipcode ?? "").trim();
                        if (!/^[0-9]{5}$/.test(zip)) return null;

                        const info = zipInfoByZip[zip];
                        if (!info) 
                        return <span className="text-gray-500">Looking up city/state…</span>;
                        if (info.error) 
                        return <span className="text-rose-700">City/state not found.</span>;

                        return <span className="text-gray-700">{info.city}, {info.state}</span>;
                        })()}
                    </div>
            </div>
                  
                <div className="mt-8 flex items-center justify-between">
                    <div className="font-bold text-black text-lg">
                    </div>
                    
    {/* CONFERENCE */}  {/* [+Add Division] Button */}
                    <button
                      type="button"
                      className={addBtn}
                      onClick={() => insertAt(["conferences", cIdx, "divisions"], conf?.divisions?.length ?? 0, makeDefaultDivision())}>
                        
                        + Add Division
                    
                    </button>
                </div>
                    
    {/* CONFERENCE */}  {/* Division/Team List */}
                <div className="mt-3 rounded border bg-gray-300 p-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(conf?.divisions || []).map((div, dIdx) => (
                    <div key={dIdx} className="rounded border bg-gray-50 p-3">
                    <div className="font-semibold mb-2">
                        
                        {div?.name?.trim() ? div.name : `Division #${dIdx + 1}`} Division
                    </div>

                    <ul className="space-y-1 text-sm">
                        {(div?.teams || []).length ? (
                        (div.teams || []).map((team, tIdx) => (
                    <li key={tIdx} className="flex items-center justify-between">
    
                    <span>{getTeamDisplayName(team)}</span>   
                    </li>))) : (<li className="text-gray-500 italic">(No teams yet)</li>)}
                    </ul>
                    </div>))}
                    
                    </div>
                </div>

    {/* DIVISION */}   {/* Division Border/Box */}
    
                    <div className="mt-4 space-y-4">
                        {(conf?.divisions || []).map((div, dIdx) => (
                            <div id={`div-${cIdx}-${dIdx}`} key={dIdx} className={`border rounded p-3 shadow-lg bg-gray-300 group ${flashClass(`div-${cIdx}-${dIdx}`)}`}>
                            <div className="text-sm font-semibold text-gray-500 mb-3">
                            
                                        {(conf?.name ?? "Unnamed Conference")}
                            </div>
                            <div className="flex items-center justify-between gap-2">
                            <div className="text-base mb-3 font-mono-ui text-transparent"> 
                                        
                                        DIVISION #{dIdx + 1}
                            </div>
                             <div className="text-xl font-bold text-gray-600">
                        
                            {(div?.name ?? "Unnamed Division")} Division
                            </div>
                            
    {/* DIVISION */}    {/* [Remove Division] Button */}
    
                    {(() => {
                const deleteKey = `delete-div-${cIdx}-${dIdx}`;
                const armed = armedDeleteKey === deleteKey;

                return (
                    <div className="flex items-center gap-2">
                    <button
                        type="button"
                        className={armed ? armedRemoveBtn : removeBtn}
                      title={armed ? "Click again to confirm delete" : "Remove division"}
                      onClick={() =>
                        confirmThen(deleteKey, () => removeAt(["conferences", cIdx, "divisions"], dIdx))
                     }
                    >
                      {armed ? "Confirm Remove" : "Remove Division"}
                     </button>

                    {armed && (
                     <button
                       type="button"
                       className={neutralBtn}
                          onClick={() => setArmedDeleteKey(null)}
                         title="Cancel"
                     >
                       Cancel
                      </button>
                     )}
                   </div>
                      );
                    })()}
                            

                            
                        </div>
                        <div className={`${labelClass} mb-1 mt-3`}>
                        
                                Division Name
                        </div>
                        <input
                          className="border p-2 w-full bg-white"
                          value={div?.name ?? ""}
                          onChange={(e) => updateField(["conferences", cIdx, "divisions", dIdx, "name"], e.target.value)}
                          placeholder="Division name"
                        />
                        
    {/* DIVISION */}    {/* TEAMS and Division Header */}
        
                <div className="mt-6 mb-3 flex items-center justify-between">
                    <div className="text-xl font-bold text-gray-600">
                    
                        TEAMS
    
                    </div>
                            
    {/* DIVISION */}    {/* Collapse all TEAMS button */}
    
                    <div className="flex items-center gap-2">
                    
                        <button
                            type="button"
                            className={neutralBtn}
                            onClick={() => {
                            const anyExpanded = isDivisionAnyTeamExpanded(cIdx, dIdx);
                            setDivisionTeamsCollapsed(cIdx, dIdx, anyExpanded); 
                            // if any expanded -> collapse all (true)
                            // else -> expand all (false)
                            }}
                            disabled={!div?.teams?.length}
                            title="Collapse or expand all teams in this division"
                            >
                            {isDivisionAnyTeamExpanded(cIdx, dIdx) ? "Collapse All Teams" : "Expand All Teams"}
                            </button>

                            
    {/* DIVISION */}    {/* [+ Add Team] Button */}
      
                        <button
                            type="button"
                            className={addBtn}
                            onClick={() =>
                            insertAt(
                            ["conferences", cIdx, "divisions", dIdx, "teams"],
                            div?.teams?.length ?? 0,
                            makeDefaultTeam()
                            )
                                    }
                            >
                        
                            + Add Team
                            
                        </button>
                    </div>
                </div>

    {/* TEAMS */}   {/* Teams Box */}
    
    <div className="mt-2 space-y-3">
        {(div?.teams || []).map((team, tIdx) => (
                            
        <div
            id={`team-${cIdx}-${dIdx}-${tIdx}`}
            key={tIdx}
            className={`border rounded p-3 group bg-blue-100 shadow-lg ${flashClass(`team-${cIdx}-${dIdx}-${tIdx}`)}`}
            onMouseDown={() => setActiveTeamKey(teamKey(cIdx, dIdx, tIdx))}
            onFocusCapture={() => setActiveTeamKey(teamKey(cIdx, dIdx, tIdx))} 
            >

    {/* TEAMS */}   {/* Teams Box HEADER (always visible) */}
    
                <div className="flex items-center justify-between w-full">

                    <button
                        type="button"
                        onClick={() => toggleTeamCollapsed(cIdx, dIdx, tIdx)}
                        className="text-left font-semibold hover:underline"
                        aria-expanded={!isTeamCollapsed(cIdx, dIdx, tIdx)}
                        aria-controls={`team-body-${cIdx}-${dIdx}-${tIdx}`}
                        title={isTeamCollapsed(cIdx, dIdx, tIdx) ? "Expand team" : "Collapse team"}
                        >
                        
                    <span className="mr-2 inline-block w-4">
                        {isTeamCollapsed(cIdx, dIdx, tIdx) ? "▸" : "▾"}
                    </span>
                        {getTeamDisplayName(team)}
                    </button>

    {/* TEAMS */}   {/* Remove TEAM Button with Confirmation */}
        {(() => {
                const deleteKey = `delete-team-${cIdx}-${dIdx}-${tIdx}`;
                const armed = armedDeleteKey === deleteKey;

                return (
            <div className="flex items-center gap-2">
            <button
                type="button"
                className={armed ? armedRemoveBtn : removeBtn}
                title={armed ? "Click again to confirm delete" : "Delete team"}
                onClick={() =>
                confirmThen(deleteKey, () =>
                removeAt(["conferences", cIdx, "divisions", dIdx, "teams"], tIdx)
                    )
                        }
                >
                    {armed ? "Confirm" : "Remove"}
            </button>

                    {armed && (
            <button
                type="button"
                className={neutralBtn}
                onClick={() => setArmedDeleteKey(null)}
                title="Cancel delete"
                >
                
                    Cancel
          
                </button>
                )}
            </div>
                );
            })()}
            </div>

    {/* TEAMS */}   {/* Teams Box BODY (collapsible content) */}
    
                <div
                    id={`team-body-${cIdx}-${dIdx}-${tIdx}`}
                    className={isTeamCollapsed(cIdx, dIdx, tIdx) ? "hidden" : "block"}
                    >
                    
                <div className="mt-3">

    {/* TEAMS */}   {/* Team Identity labels */}
    
                <div className="grid grid-cols-3 gap-2 mt-2">
                    <div className={labelClass}>
                
                        Abbreviation
                    
                    </div>
                
                    <div className={labelClass}>
                    
                        Team Name
                    
                    </div>
                
                    <div className={labelClass}>
                
                        Mascot
                
                    </div>
                </div>

    {/* TEAMS */}   {/* Team Identity fields */}
    
                <div className="grid grid-cols-3 gap-2 mt-1">
                    <input
                        className="border p-2 bg-white"
                        value={team?.abbreviation ?? ""}
                        onChange={(e) => updateField(["conferences", cIdx, "divisions", dIdx, "teams", tIdx, "abbreviation"], e.target.value)}
                        placeholder="Abbrev"
                    />
 
                    <input
                        className="border p-2 bg-white"
                        value={team?.name ?? ""}
                        onChange={(e) => updateField(["conferences", cIdx, "divisions", dIdx, "teams", tIdx, "name"], e.target.value)}
                        placeholder="Team name"
                    />

                    <input
                        className="border p-2 bg-white"
                        value={team?.mascot ?? ""}
                        onChange={(e) => updateField(["conferences", cIdx, "divisions", dIdx, "teams", tIdx, "mascot"], e.target.value)}
                        placeholder="Mascot"
                    />
                </div>

    {/* TEAMS */}   {/* Team Location/Colors labels */}
    
                <div className="grid grid-cols-3 gap-2 mt-2">
                    <div className={labelClass}>
                    
                        Zip Code
                        
                    </div>
                    
                    <div className={labelClass}>
                    
                        Primary Color
                        
                    </div>
                    
                    <div className={labelClass}>
                    
                        Secondary Color
                        
                    </div>
                </div>

    {/* TEAMS */}   {/* Team Location/Colors fields */}
    
            <div className="grid grid-cols-3 gap-2 mt-1">
                <div className="space-y-1">

                    <input
                        className="border p-2 bg-white w-full"
                        value={team?.zipcode ?? ""}
                        onChange={(e) =>
                        updateField(
                        ["conferences", cIdx, "divisions", dIdx, "teams", tIdx, "zipcode"],
                        e.target.value
                                    )
                                }
                        placeholder="Zipcode"
                    />

                    {(() => {
                        
                    const zip = String(team?.zipcode ?? "").trim();
                    if (!/^[0-9]{5}$/.test(zip)) return null;
                    const info = zipInfoByZip[zip];
                    if (!info) return <div className="text-xs text-gray-500">Looking up city/state…</div>;
                    if (info.error) return <div className="text-xs text-rose-700">City/state not found.</div>;

                    return <div className="text-xs text-gray-700">{info.city}, {info.state}</div>;
                    
                    })()}
                </div>

    {/* TEAMS */}   {/* PRIMARY Color Field*/}
    
            <div className="space-y-1">
                <div className="flex items-end gap-2">
                
                    <input
                        type="color"
                        className="h-10 w-36 border bg-white p-1"
                        value={safeColorValue(team?.primaryColor)}
                        onChange={(e) =>
                        updateField(
                        ["conferences", cIdx, "divisions", dIdx, "teams", tIdx, "primaryColor"],
                        e.target.value
                        )
                        }
                        title="Primary color"
                    />

                    <input
                        type="text"
                        className={`border p-2 bg-white w-full font-mono-ui ${
                        team?.primaryColor && !isHex6(normalizeHex(team.primaryColor)) ? "border-rose-500" : ""
                        }`}
                        value={team?.primaryColor ?? ""}
                        onChange={(e) => {
                        const next = normalizeHex(e.target.value);
                        updateField(
                        ["conferences", cIdx, "divisions", dIdx, "teams", tIdx, "primaryColor"],
                        next
                        );
                        }}
                        placeholder="#1A2B3C"
                    />
                </div>

                        {team?.primaryColor && !isHex6(normalizeHex(team.primaryColor)) ? (
                        
                    <div className="text-xs text-rose-700">
                        Hex must be #RRGGBB (example: #0F172A).
                    </div>
                        ) : null}
            </div>

    {/* TEAMS */} {/* SECONDARY Color Field*/}
                    <div className="space-y-1">
                        <div className="flex items-end gap-2">
                        <input
                            type="color"
                            className="h-10 w-36 border bg-white p-1"
                            value={safeColorValue(team?.secondaryColor)}
                            onChange={(e) =>
                             updateField(
                            ["conferences", cIdx, "divisions", dIdx, "teams", tIdx, "secondaryColor"],
                           e.target.value
                         )
                           }
                           title="Secondary color"
                          />

                         <input
                          type="text"
                           className={`border p-2 bg-white w-full font-mono-ui ${
                           team?.secondaryColor && !isHex6(normalizeHex(team.secondaryColor)) ? "border-rose-500" : ""
                          }`}
                          value={team?.secondaryColor ?? ""}
                          onChange={(e) => {
                           const next = normalizeHex(e.target.value);
                           updateField(
                              ["conferences", cIdx, "divisions", dIdx, "teams", tIdx, "secondaryColor"],
                               next
                            );
                           }}
                           placeholder="#1A2B3C"
                          />
                       </div>

                        {team?.secondaryColor && !isHex6(normalizeHex(team.secondaryColor)) ? (
                          <div className="text-xs text-rose-700">
                               Hex must be #RRGGBB (example: #0F172A).
                     </div>
                        ) : null}
                      </div>
                    </div>

    {/* TEAMS */}   {/* Team Attributes */}
                              <div className="grid grid-cols-1 gap-3 mt-5">
                                {Object.entries(team?.attributes || defaultAttributes).map(([key, val]) =>
                                  key !== "attendance" ? (
                                   <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                    <label className="font-semibold text-base text-left">
                        {key}:
                    </label>

                    <div className="flex items-center gap-3">
                    <span className="font-semibold text-base bg-amber-100 px-2 rounded w-8 text-center">
                        {val}
                    </span>

                    <input
                        type="range"
                        min={1}
                        max={10}
                        value={typeof val === "number" ? val : 1}
                        onChange={(e) =>
                        updateField(
                        ["conferences", cIdx, "divisions", dIdx, "teams", tIdx, "attributes", key],
                         parseInt(e.target.value, 10)
                        )
                        }
                        className="flex-0"
                        />
                        </div>
                        </div>
                                  ) : (
                                    <div key={key}>
                                      <label className="font-semibold text-base pr-2 mt-3 mb-3">attendance:</label>
                                      <input
                                        type="number"
                                        className="border p-2 bg-white w-48"
                                        value={typeof val === "number" ? val : 0}
                                        onChange={(e) =>
                                          updateField(
                                            ["conferences", cIdx, "divisions", dIdx, "teams", tIdx, "attributes", key],
                                            parseInt(e.target.value, 10) || 0
                                          )
                                        }
                                      />
                                    </div>
                                  )
                                )}
                              </div>

    {/* TEAMS */}   {/* Team Meta Labels */}
                              <div className="grid grid-cols-3 gap-2 mt-5">
                                <div className={labelClass}>Archetype</div>
                                <div className={labelClass}>Fanbase Type</div>
                                <div className={labelClass}>Rival</div>
                              </div>

    {/* TEAMS */}   {/* Team Meta Fields */}
                            <div className="grid grid-cols-3 gap-2 mt-1">
                              
    {/* TEAMS */}   {/* Team Archetype Dropdown */}                                
                            <select
                            className="border p-2 bg-slate-100"
                            value={team?.archetype ?? ""}
                            onChange={(e) =>
                                updateField(
                                ["conferences", cIdx, "divisions", dIdx, "teams", tIdx, "archetype"],
                                e.target.value)}
                                required
                                >
                            <option value="" disabled>
                                Select Team Archetype…
                            </option>
                            <option value="academic-focused">academic-focused</option>
                            <option value="academic-powerhouse">academic-powerhouse</option>
                            <option value="balanced">balanced</option>
                            <option value="campus-treasure">campus-treasure</option>
                            <option value="football-focused">football-focused</option>
                            <option value="football-second">football-second</option>
                            <option value="football-agnostic">football-agnostic</option>
                            <option value="future-forward">future-forward</option>
                            <option value="media-mogul">media-mogul</option>
                            <option value="party-school">party-school</option>
                            <option value="the-main-attraction">the-main-attraction</option>
                            <option value="tradition-rich">tradition-rich</option>
                            </select>
                                                                   
    {/* TEAMS */}   {/* Team Fanbase Type Dropdown */}                                
                            <select
                            className="border p-2 bg-slate-100"
                            value={team?.fanbaseType ?? ""}
                            onChange={(e) =>
                                updateField(
                                ["conferences", cIdx, "divisions", dIdx, "teams", tIdx, "fanbaseType"],
                                e.target.value
                                )
                                }
                                required
                                >
                            <option value="" disabled>
                                Select Fanbase Type…
                            </option>
                            <option value="reasonable">reasonable</option>
                            <option value="stubborn">stubborn</option>
                            <option value="volatile">volatile</option>
                            <option value="ride-or-die">ride-or-die</option>
                            </select>
  
    {/* TEAMS */}   {/* Team Rival Dropdown */}                       
               {(() => {
                const divisionTeams = Array.isArray(div?.teams) ? div.teams : [];

                const rivalOptions = divisionTeams
                    .map((t, idx) => ({ team: t, idx }))
                    .filter(({ idx, team: t }) => idx !== tIdx && String(t?.abbreviation ?? "").trim())
                    .map(({ team: t }) => ({
                    abbr: String(t.abbreviation).trim(),
                    label: getTeamDisplayName(t)
                    }))
                    .sort((a, b) => a.label.localeCompare(b.label));

                const current = String(team?.rivalAbbreviation ?? "").trim();
                const hasCurrent = rivalOptions.some((o) => o.abbr === current);

                return (
                <select
                className="border p-2 text-sm bg-amber-50"
                value={current}
                onChange={(e) =>
                updateField(
                ["conferences", cIdx, "divisions", dIdx, "teams", tIdx, "rivalAbbreviation"],
                e.target.value
                    )
                }
                required
                >
                {!hasCurrent ? (
                <option value="" disabled>
                Select a rival…
                </option>
                ) : null}

                {rivalOptions.map((opt) => (
                <option key={opt.abbr} value={opt.abbr}>
                {opt.label}
                </option>
                ))}
                </select>
                );
                })()}
    
                                        </div>
                                    </div>
                                </div>
                            </div>
            ))}
     
            <div className="mt-4 mb-1 flex items-center justify-between">
                        
                    <div className="text-xl font-bold text-transparent">
                    
                        TEAMS
    
                    </div>    

                        <button
                            type="button"
                            className={addBtn}
                            onClick={() =>
                            insertAt(
                            ["conferences", cIdx, "divisions", dIdx, "teams"],
                            div?.teams?.length ?? 0,
                            makeDefaultTeam()
                            )
                                    }
                            >
                        
                            + Add Team
                            
                        </button> 
                </div>

                        </div>
                    </div>
                      
        ))}

                </div>
            </div>
                
    ))}
    
            </div>
        
    </section>


    {/* Copy and Download JSON Buttons 'BOTTOM' */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
        <button
            type="button"
            onClick={copyJsonToClipboard}
            className="px-4 py-3 rounded text-lg bg-black text-white hover:bg-gray-700 disabled:bg-gray-300"
            disabled={!universe}
            >
            Copy JSON to Clipboard
        </button>

        <button
            type="button"
            onClick={downloadJsonFile}
            className="px-4 py-3 rounded text-lg bg-slate-500 text-white hover:bg-gray-700 disabled:bg-gray-300"
            disabled={!universe}
            >
            Download JSON File
        </button>
        </div>

            
                
        </>
      )}
    </div>
  );
}
