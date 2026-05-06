"""
Optimal Route Planning API using Genetic Algorithm
Backend Flask Application
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import random
import math
import copy
import os
import json

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Global dataset cache
CITIES_DF = None
CITIES_LIST = []


def to_native(obj):
    """Convert numpy types to native Python types for JSON serialization."""
    if isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {k: to_native(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [to_native(item) for item in obj]
    return obj


def load_dataset():
    """Load and cache the world cities dataset."""
    global CITIES_DF, CITIES_LIST
    if CITIES_DF is None:
        csv_path = os.path.join(os.path.dirname(__file__), '..', 'worldcities.csv')
        df = pd.read_csv(csv_path, on_bad_lines='skip', encoding='utf-8')
        df = df[['city', 'lat', 'lng']].copy()
        df.dropna(inplace=True)
        df['lat'] = pd.to_numeric(df['lat'], errors='coerce')
        df['lng'] = pd.to_numeric(df['lng'], errors='coerce')
        df.dropna(inplace=True)
        # Remove duplicates by city name, keeping first occurrence
        df = df.drop_duplicates(subset=['city'], keep='first')
        df = df.reset_index(drop=True)
        CITIES_DF = df
        # Create plain Python list for JSON serialization
        CITIES_LIST = [
            {'city': str(row['city']), 'lat': float(row['lat']), 'lng': float(row['lng'])}
            for _, row in df.iterrows()
        ]
    return CITIES_DF


def haversine_distance(point_a, point_b):
    """
    Calculate the great-circle distance between two points on Earth.
    More accurate than Euclidean for geographic coordinates.
    """
    lat1, lon1 = math.radians(point_a[0]), math.radians(point_a[1])
    lat2, lon2 = math.radians(point_b[0]), math.radians(point_b[1])
    
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    r = 6371  # Earth's radius in kilometers
    
    return c * r


def euclidean_distance(point_a, point_b):
    """Compute Euclidean distance for 2D coordinates."""
    return math.sqrt((point_a[0] - point_b[0])**2 + (point_a[1] - point_b[1])**2)


def total_route_distance(route, coords, use_haversine=True):
    """Compute total distance of a route."""
    total = 0.0
    dist_fn = haversine_distance if use_haversine else euclidean_distance
    for i in range(len(route) - 1):
        total += dist_fn(coords[route[i]], coords[route[i+1]])
    return total


# ═══════════════════════════════════════════════════════════════════════════════
# GENETIC ALGORITHM IMPLEMENTATION
# ═══════════════════════════════════════════════════════════════════════════════

def create_population(pop_size, num_intermediate):
    """
    Create initial population of routes.
    Route format: [source_idx, intermediate_permutation..., destination_idx]
    """
    population = []
    base = list(range(num_intermediate))
    for _ in range(pop_size):
        individual = base.copy()
        random.shuffle(individual)
        population.append(individual)
    return population


def fitness(route, source_idx, dest_idx, coords, use_haversine=True):
    """
    Fitness is inverse of total route distance.
    Route is just the intermediate cities permutation.
    """
    full_route = [source_idx] + route + [dest_idx]
    dist = total_route_distance(full_route, coords, use_haversine)
    return 1.0 / dist if dist > 0 else float('inf')


def evaluate_population(population, source_idx, dest_idx, coords, use_haversine=True):
    """Evaluate fitness for entire population."""
    scored = [(fitness(route, source_idx, dest_idx, coords, use_haversine), route) 
              for route in population]
    scored.sort(key=lambda x: x[0], reverse=True)
    return scored


def tournament_selection(population, source_idx, dest_idx, coords, tournament_size=5, use_haversine=True):
    """Tournament selection: pick best from random competitors."""
    competitors = random.sample(population, min(tournament_size, len(population)))
    winner = max(competitors, key=lambda route: fitness(route, source_idx, dest_idx, coords, use_haversine))
    return winner


def roulette_selection(population, source_idx, dest_idx, coords, use_haversine=True):
    """Roulette wheel selection: probability proportional to fitness."""
    fitness_scores = [fitness(route, source_idx, dest_idx, coords, use_haversine) for route in population]
    total_fitness = sum(fitness_scores)
    
    if total_fitness == 0:
        return random.choice(population)
    
    pick = random.uniform(0, total_fitness)
    current = 0
    for route, score in zip(population, fitness_scores):
        current += score
        if current >= pick:
            return route
    return population[-1]


def order_crossover(parent1, parent2):
    """Order Crossover (OX) for permutation-based chromosomes."""
    n = len(parent1)
    if n <= 1:
        return parent1.copy(), parent2.copy()
    
    start, end = sorted(random.sample(range(n), 2))
    
    def _ox(p1, p2):
        child = [None] * n
        child[start:end+1] = p1[start:end+1]
        segment_set = set(p1[start:end+1])
        remaining = [gene for gene in p2 if gene not in segment_set]
        
        idx = 0
        for i in range(n):
            if child[i] is None:
                child[i] = remaining[idx]
                idx += 1
        return child
    
    child1 = _ox(parent1, parent2)
    child2 = _ox(parent2, parent1)
    return child1, child2


def swap_mutation(route, mutation_rate=0.02):
    """Swap mutation: randomly swap two cities."""
    mutated_route = route.copy()
    if len(route) >= 2 and random.random() < mutation_rate:
        i, j = random.sample(range(len(mutated_route)), 2)
        mutated_route[i], mutated_route[j] = mutated_route[j], mutated_route[i]
    return mutated_route


def next_generation(population, source_idx, dest_idx, coords,
                    elite_size=5, tournament_size=5, mutation_rate=0.02,
                    selection_method='tournament', use_haversine=True):
    """Generate next generation using elitism, selection, crossover, mutation."""
    scored = evaluate_population(population, source_idx, dest_idx, coords, use_haversine)
    elites = [route for (_, route) in scored[:elite_size]]
    new_pop = copy.deepcopy(elites)
    
    def select_parent():
        if selection_method == 'roulette':
            return roulette_selection(population, source_idx, dest_idx, coords, use_haversine)
        return tournament_selection(population, source_idx, dest_idx, coords, tournament_size, use_haversine)
    
    while len(new_pop) < len(population):
        parent1 = select_parent()
        parent2 = select_parent()
        
        child1, child2 = order_crossover(parent1, parent2)
        child1 = swap_mutation(child1, mutation_rate)
        child2 = swap_mutation(child2, mutation_rate)
        
        new_pop.append(child1)
        if len(new_pop) < len(population):
            new_pop.append(child2)
    
    return new_pop


def run_genetic_algorithm(source_idx, dest_idx, coords, intermediate_indices,
                          pop_size=100, generations=150, elite_size=10,
                          mutation_rate=0.03, crossover_rate=0.8,
                          tournament_size=5, selection_method='tournament',
                          use_haversine=True, progress_callback=None):
    """
    Run complete GA optimization.
    Returns all routes found, best route, and generation history.
    """
    num_intermediate = len(intermediate_indices)
    
    # Create mapping between permutation indices and actual city indices
    def perm_to_route(perm):
        return [intermediate_indices[i] for i in perm]
    
    # Initialize population with permutations of intermediate city indices
    population = create_population(pop_size, num_intermediate)
    
    # Track progress
    history = {
        'best_distances': [],
        'avg_distances': [],
        'best_fitness': []
    }
    
    all_routes = []
    
    for gen in range(1, generations + 1):
        population = next_generation(
            population, source_idx, dest_idx, coords,
            elite_size, tournament_size, mutation_rate,
            selection_method, use_haversine
        )
        
        # Evaluate current generation
        all_dists = []
        for perm in population:
            route = perm_to_route(perm)
            full_route = [source_idx] + route + [dest_idx]
            dist = total_route_distance(full_route, coords, use_haversine)
            all_dists.append((dist, route, full_route))
        
        all_dists.sort(key=lambda x: x[0])
        best_dist = all_dists[0][0]
        avg_dist = sum(d[0] for d in all_dists) / len(all_dists)
        
        history['best_distances'].append(best_dist)
        history['avg_distances'].append(avg_dist)
        history['best_fitness'].append(1.0 / best_dist if best_dist > 0 else 0)
        
        # Store unique routes from this generation
        if gen % 10 == 0 or gen == 1 or gen == generations:
            for dist, route, full_route in all_dists[:20]:  # Top 20 from each checkpoint
                route_key = tuple(full_route)
                if route_key not in [tuple(r['full_route']) for r in all_routes]:
                    all_routes.append({
                        'route': route,
                        'full_route': full_route,
                        'distance': dist,
                        'generation': gen
                    })
        
        if progress_callback and gen % 10 == 0:
            progress_callback(gen, best_dist, avg_dist)
    
    # Final evaluation - get best routes
    final_dists = []
    for perm in population:
        route = perm_to_route(perm)
        full_route = [source_idx] + route + [dest_idx]
        dist = total_route_distance(full_route, coords, use_haversine)
        final_dists.append((dist, route, full_route, perm))
    
    final_dists.sort(key=lambda x: x[0])
    
    # Get unique best routes
    best_routes = []
    seen = set()
    for dist, route, full_route, perm in final_dists:
        route_key = tuple(full_route)
        if route_key not in seen:
            seen.add(route_key)
            best_routes.append({
                'route': route,
                'full_route': full_route,
                'distance': dist,
                'intermediate_count': len(route)
            })
    
    best_route = best_routes[0] if best_routes else None
    
    return {
        'best_route': best_route,
        'all_routes': best_routes[:50],
        'history': history,
        'final_population_size': len(population)
    }


def run_genetic_algorithm_fast(source_idx, dest_idx, coords, intermediate_indices,
                               pop_size=60, generations=80, elite_size=5,
                               mutation_rate=0.04, tournament_size=3,
                               use_haversine=True, seed=42):
    """
    Fast GA optimized for < 2 second response time.
    DETERMINISTIC: Same input always produces same output.
    Returns exactly top 5 unique routes.
    """
    import time
    
    # CRITICAL: Set fixed seeds for deterministic behavior
    random.seed(seed)
    np.random.seed(seed)
    
    start_time = time.time()
    
    num_intermediate = len(intermediate_indices)
    
    def perm_to_route(perm):
        return [intermediate_indices[i] for i in perm]
    
    def calc_distance(perm):
        route = perm_to_route(perm)
        full_route = [source_idx] + route + [dest_idx]
        return total_route_distance(full_route, coords, use_haversine)
    
    # Initialize population
    population = create_population(pop_size, num_intermediate)
    
    # Evolve
    for gen in range(1, generations + 1):
        population = next_generation(
            population, source_idx, dest_idx, coords,
            elite_size, tournament_size, mutation_rate,
            'tournament', use_haversine
        )
    
    # Get unique routes with distances
    final_routes = {}
    for perm in population:
        route = perm_to_route(perm)
        full_route = tuple([source_idx] + route + [dest_idx])
        if full_route not in final_routes:
            dist = calc_distance(perm)
            final_routes[full_route] = {
                'route': route,
                'full_route': list(full_route),
                'distance': float(dist)
            }
    
    # Sort by distance and take exactly top 5
    sorted_routes = sorted(final_routes.values(), key=lambda x: x['distance'])
    top_routes = sorted_routes[:5]  # EXACTLY 5 routes
    
    elapsed_ms = int((time.time() - start_time) * 1000)
    
    return {
        'best_route': top_routes[0] if top_routes else None,
        'all_routes': top_routes,
        'time_ms': elapsed_ms
    }


# ═══════════════════════════════════════════════════════════════════════════════
# API ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@app.route('/cities', methods=['GET'])
def get_cities():
    """Get list of all available cities."""
    load_dataset()
    return jsonify({
        'cities': CITIES_LIST,
        'count': len(CITIES_LIST)
    })


@app.route('/city-coords', methods=['POST'])
def get_city_coords():
    """Get coordinates for specific cities."""
    data = request.json
    city_names = data.get('cities', [])
    load_dataset()
    
    coords = {}
    for city in city_names:
        for c in CITIES_LIST:
            if c['city'] == city:
                coords[city] = {'lat': c['lat'], 'lng': c['lng']}
                break
    
    return jsonify({'coordinates': coords})


@app.route('/optimize-route', methods=['POST'])
def optimize_route():
    """
    STRICT geospatial route optimization with validated coordinates.
    MAX 2-3 intermediate cities, tight bounding box ±1°.
    Returns: realistic routes with proper haversine distances.
    """
    try:
        data = request.json or {}
        
        source_city = data.get('source')
        dest_city = data.get('destination')
        
        # Validate inputs
        if not source_city or not dest_city:
            return jsonify({'error': 'Source and destination cities are required'}), 400
        
        if source_city == dest_city:
            return jsonify({'error': 'Source and destination must be different cities'}), 400
        
        df = load_dataset()
        
        # ═══════════════════════════════════════════════════════════════════════════════
        # STEP 1: STRICT DATA VALIDATION - Fetch EXACT coordinates from dataset
        # ═══════════════════════════════════════════════════════════════════════════════
        
        source_row = df[df['city'].str.lower() == source_city.lower()]
        dest_row = df[df['city'].str.lower() == dest_city.lower()]
        
        if source_row.empty:
            # Try exact match
            source_row = df[df['city'] == source_city]
        if dest_row.empty:
            dest_row = df[df['city'] == dest_city]
        
        if source_row.empty:
            return jsonify({'error': f'Source city "{source_city}" not found in database'}), 404
        if dest_row.empty:
            return jsonify({'error': f'Destination city "{dest_city}" not found in database'}), 404
        
        # Extract exact coordinates - FIRST ROW ONLY (strict)
        source_lat = float(source_row.iloc[0]['lat'])
        source_lng = float(source_row.iloc[0]['lng'])
        dest_lat = float(dest_row.iloc[0]['lat'])
        dest_lng = float(dest_row.iloc[0]['lng'])
        
        # Debug logging
        print(f"\n{'='*60}")
        print(f"ROUTE OPTIMIZATION: {source_city} → {dest_city}")
        print(f"{'='*60}")
        print(f"{source_city} → lat: {source_lat:.6f}, lon: {source_lng:.6f}")
        print(f"{dest_city} → lat: {dest_lat:.6f}, lon: {dest_lng:.6f}")
        
        # ═══════════════════════════════════════════════════════════════════════════════
        # STEP 2: CALCULATE DIRECT DISTANCE (validation baseline)
        # ═══════════════════════════════════════════════════════════════════════════════
        
        direct_distance = haversine_distance([source_lat, source_lng], [dest_lat, dest_lng])
        print(f"Direct Distance = {direct_distance:.2f} km")
        
        # Maximum acceptable distance (1.5x direct)
        MAX_ACCEPTABLE_DISTANCE = direct_distance * 1.5
        print(f"Max Acceptable (1.5x direct) = {MAX_ACCEPTABLE_DISTANCE:.2f} km")
        
        # ═══════════════════════════════════════════════════════════════════════════════
        # STEP 3: TIGHT BOUNDING BOX FILTERING (±1° only)
        # ═══════════════════════════════════════════════════════════════════════════════
        
        # Strict ±1 degree buffer (~111km at equator, tighter at higher latitudes)
        BUFFER_DEGREES = 1.0
        
        min_lat = min(source_lat, dest_lat) - BUFFER_DEGREES
        max_lat = max(source_lat, dest_lat) + BUFFER_DEGREES
        min_lng = min(source_lng, dest_lng) - BUFFER_DEGREES
        max_lng = max(source_lng, dest_lng) + BUFFER_DEGREES
        
        print(f"Bounding Box: lat[{min_lat:.2f}, {max_lat:.2f}], lng[{min_lng:.2f}, {max_lng:.2f}]")
        
        # Filter cities within tight bounding box
        candidate_cities = [
            city for city in CITIES_LIST
            if city['city'] not in [source_city, dest_city]
            and min_lat <= city['lat'] <= max_lat
            and min_lng <= city['lng'] <= max_lng
        ]
        
        print(f"Candidates in bounding box: {len(candidate_cities)}")
        
        # ═══════════════════════════════════════════════════════════════════════════════
        # STEP 4: LIMIT INTERMEDIATE CITIES (MAX 2-3)
        # ═══════════════════════════════════════════════════════════════════════════════
        
        # Strict limit: 2-3 intermediate cities maximum
        if len(candidate_cities) >= 20:
            num_intermediate = 3
        elif len(candidate_cities) >= 10:
            num_intermediate = 2
        else:
            num_intermediate = min(2, len(candidate_cities))
        
        print(f"Using {num_intermediate} intermediate cities max")
        
        # If not enough candidates, expand slightly (but still strict)
        if len(candidate_cities) < num_intermediate + 1:
            # Expand by 0.5 degrees
            min_lat -= 0.5
            max_lat += 0.5
            min_lng -= 0.5
            max_lng += 0.5
            candidate_cities = [
                city for city in CITIES_LIST
                if city['city'] not in [source_city, dest_city]
                and min_lat <= city['lat'] <= max_lat
                and min_lng <= city['lng'] <= max_lng
            ]
            print(f"Expanded candidates: {len(candidate_cities)}")
        
        # If still not enough, use closest cities by distance from midpoint
        if len(candidate_cities) < num_intermediate + 1:
            mid_lat = (source_lat + dest_lat) / 2
            mid_lng = (source_lng + dest_lng) / 2
            
            def distance_from_midpoint(city):
                return haversine_distance([mid_lat, mid_lng], [city['lat'], city['lng']])
            
            all_other_cities = [c for c in CITIES_LIST if c['city'] not in [source_city, dest_city]]
            all_other_cities.sort(key=distance_from_midpoint)
            candidate_cities = all_other_cities[:15]  # Take only 15 closest
            print(f"Using closest 15 cities to midpoint")
        
        # Select diverse candidates (spatially distributed)
        random.seed(42)
        if len(candidate_cities) > num_intermediate * 3:
            # Sort by distance from source to get spatial diversity
            candidate_cities.sort(
                key=lambda c: haversine_distance([source_lat, source_lng], [c['lat'], c['lng']])
            )
            # Take evenly spaced cities for diversity
            step = len(candidate_cities) // (num_intermediate * 3)
            selected_candidates = [candidate_cities[i * step] for i in range(num_intermediate * 3)]
        else:
            selected_candidates = candidate_cities
        
        # Build coordinate lookup for fast access
        coords_lookup = {city['city']: [city['lat'], city['lng']] for city in CITIES_LIST}
        
        # Build route using GA on filtered candidates
        # Chromosome: permutation of indices into selected_candidates
        pop_size = min(60, len(selected_candidates) * 5)
        generations = 50  # Reduced for faster response
        
        # Initialize population with valid routes
        def create_route_chromosome():
            # Randomly select num_intermediate cities from candidates
            indices = list(range(len(selected_candidates)))
            random.shuffle(indices)
            return indices[:num_intermediate]
        
        population = [create_route_chromosome() for _ in range(pop_size)]
        
        # ═══════════════════════════════════════════════════════════════════════════════
        # STEP 5: FITNESS WITH DEVIATION PENALTY
        # ═══════════════════════════════════════════════════════════════════════════════
        
        def calculate_route_distance(chromosome):
            """Calculate total route distance using haversine."""
            route_coords = [[source_lat, source_lng]]  # Start at source
            for idx in chromosome:
                city = selected_candidates[idx]
                route_coords.append([city['lat'], city['lng']])
            route_coords.append([dest_lat, dest_lng])  # End at destination
            
            total = 0.0
            for i in range(len(route_coords) - 1):
                total += haversine_distance(route_coords[i], route_coords[i+1])
            return total
        
        def point_to_line_distance(point, line_start, line_end):
            """Calculate perpendicular distance from point to great circle line."""
            # Convert to radians
            lat_p, lon_p = math.radians(point[0]), math.radians(point[1])
            lat_s, lon_s = math.radians(line_start[0]), math.radians(line_start[1])
            lat_e, lon_e = math.radians(line_end[0]), math.radians(line_end[1])
            
            # Calculate cross-track distance (simplified)
            # Using spherical law of cosines for cross-track
            d13 = haversine_distance(line_start, point) / 6371  # angular distance
            d12 = haversine_distance(line_start, line_end) / 6371
            
            if d12 == 0:
                return haversine_distance(line_start, point)
            
            # Course from start to point
            y = math.sin(lon_p - lon_s) * math.cos(lat_p)
            x = math.cos(lat_s) * math.sin(lat_p) - math.sin(lat_s) * math.cos(lat_p) * math.cos(lon_p - lon_s)
            course_sp = math.atan2(y, x)
            
            # Course from start to end
            y = math.sin(lon_e - lon_s) * math.cos(lat_e)
            x = math.cos(lat_s) * math.sin(lat_e) - math.sin(lat_s) * math.cos(lat_e) * math.cos(lon_e - lon_s)
            course_se = math.atan2(y, x)
            
            # Cross-track distance in radians
            cross_track = math.asin(math.sin(d13) * math.sin(course_sp - course_se))
            
            # Convert to km
            return abs(cross_track) * 6371
        
        def calculate_deviation_penalty(chromosome):
            """Calculate penalty for deviation from straight line."""
            if not chromosome:
                return 0
            
            total_deviation = 0
            for idx in chromosome:
                city = selected_candidates[idx]
                dev = point_to_line_distance(
                    [city['lat'], city['lng']],
                    [source_lat, source_lng],
                    [dest_lat, dest_lng]
                )
                total_deviation += dev
            
            # Penalty factor: deviation from direct line adds 50% weight
            return total_deviation * 0.5
        
        def fitness(chromosome):
            """Fitness with distance + deviation penalty."""
            dist = calculate_route_distance(chromosome)
            penalty = calculate_deviation_penalty(chromosome)
            
            # STEP 6: Reject routes exceeding 1.5x direct distance
            if dist > MAX_ACCEPTABLE_DISTANCE:
                return 0.0001  # Very low fitness (rejected)
            
            total_cost = dist + penalty
            return 1.0 / (total_cost + 1.0)
        
        # Helper to ensure population diversity
        def make_chromosome_key(chromo):
            """Create unique key preserving order (different order = different route)"""
            return tuple(chromo)
        
        def ensure_diversity(pop, max_duplicates=2):
            """Limit duplicate chromosomes in population"""
            seen = {}
            diverse_pop = []
            for chromo in pop:
                key = make_chromosome_key(chromo)
                seen[key] = seen.get(key, 0) + 1
                if seen[key] <= max_duplicates:
                    diverse_pop.append(chromo)
                else:
                    # Replace with a new random chromosome
                    indices = list(range(len(selected_candidates)))
                    random.shuffle(indices)
                    new_chromo = indices[:num_intermediate]
                    diverse_pop.append(new_chromo)
            return diverse_pop
        
        # ═══════════════════════════════════════════════════════════════════════════════
        # GENERATION HISTORY TRACKING
        # ═══════════════════════════════════════════════════════════════════════════════
        
        generation_history = []
        
        # GA evolution
        for gen in range(generations):
            # Evaluate fitness
            scored = [(fitness(c), c) for c in population]
            scored.sort(key=lambda x: x[0], reverse=True)
            
            # ═══════════════════════════════════════════════════════════════════════════
            # TRACK GENERATION METRICS
            # ═══════════════════════════════════════════════════════════════════════════
            
            # Calculate actual distances for all chromosomes (not fitness scores)
            distances = [calculate_route_distance(c) for c in population]
            distances.sort()
            
            best_dist = distances[0]
            worst_dist = distances[-1]
            avg_dist = sum(distances) / len(distances)
            
            # Store every 5th generation + first + last to reduce data size
            if gen == 0 or gen == generations - 1 or gen % 5 == 0 or gen % 10 == 0:
                generation_history.append({
                    'generation': gen + 1,
                    'best': round(best_dist, 2),
                    'average': round(avg_dist, 2),
                    'worst': round(worst_dist, 2)
                })
            
            # Elitism: keep top 10% (ensure they're unique)
            elite_count = max(2, pop_size // 10)
            seen_elites = set()
            new_population = []
            for fit_score, chromo in scored:
                key = make_chromosome_key(chromo)
                if key not in seen_elites:
                    seen_elites.add(key)
                    new_population.append(chromo)
                if len(new_population) >= elite_count:
                    break
            
            # Generate offspring
            attempts = 0  # Prevent infinite loop
            while len(new_population) < pop_size and attempts < pop_size * 3:
                attempts += 1
                
                # Tournament selection
                tournament_size = 3
                parents = []
                for _ in range(2):
                    competitors = random.sample(scored, min(tournament_size, len(scored)))
                    winner = max(competitors, key=lambda x: x[0])[1]
                    parents.append(winner)
                
                parent1, parent2 = parents
                
                # Crossover: take random subset from parent1, fill rest from parent2
                if random.random() < 0.8:  # Crossover rate
                    # Order crossover (OX) adapted for variable length
                    child = []
                    # Take some cities from parent1
                    take_from_p1 = random.randint(1, num_intermediate - 1) if num_intermediate > 2 else 1
                    p1_indices = random.sample(parent1, min(take_from_p1, len(parent1)))
                    child.extend(p1_indices)
                    
                    # Fill remaining from parent2 (avoiding duplicates)
                    p2_remaining = [idx for idx in parent2 if idx not in child]
                    needed = num_intermediate - len(child)
                    if len(p2_remaining) >= needed:
                        child.extend(random.sample(p2_remaining, needed))
                    else:
                        # Add random new cities if needed
                        all_indices = set(range(len(selected_candidates)))
                        available = list(all_indices - set(child))
                        if available:
                            child.extend(random.sample(available, min(needed, len(available))))
                    
                    # Ensure correct length
                    if len(child) > num_intermediate:
                        child = child[:num_intermediate]
                    elif len(child) < num_intermediate and len(selected_candidates) > num_intermediate:
                        needed = num_intermediate - len(child)
                        available = [i for i in range(len(selected_candidates)) if i not in child]
                        if available:
                            child.extend(random.sample(available, min(needed, len(available))))
                else:
                    # No crossover, just copy best parent
                    child = parent1.copy() if fitness(parent1) > fitness(parent2) else parent2.copy()
                
                # Mutation: swap two cities
                if random.random() < 0.15 and len(child) >= 2:  # Increased mutation for diversity
                    i, j = random.sample(range(len(child)), 2)
                    child[i], child[j] = child[j], child[i]
                
                # Check if child is duplicate before adding
                child_key = make_chromosome_key(child)
                if child_key not in [make_chromosome_key(c) for c in new_population] or attempts > pop_size * 2:
                    new_population.append(child)
            
            # Fill remaining slots with random chromosomes if needed
            while len(new_population) < pop_size:
                indices = list(range(len(selected_candidates)))
                random.shuffle(indices)
                new_population.append(indices[:num_intermediate])
            
            population = ensure_diversity(new_population[:pop_size])
        
        # ═══════════════════════════════════════════════════════════════════════════════
        # EXTRACT UNIQUE ROUTES WITH MULTI-LEVEL DEDUPLICATION
        # ═══════════════════════════════════════════════════════════════════════════════
        
        # Collect all routes from final population with their actual city sequence
        all_routes_list = []
        for chromo in population:
            # Create unique key based on ORDERED city sequence (order matters!)
            route_key = tuple(chromo)  # Preserve order - different order = different route
            cities_sequence = [source_city] + [selected_candidates[idx]['city'] for idx in chromo] + [dest_city]
            city_key = '-'.join(cities_sequence)  # String key for debugging
            dist = calculate_route_distance(chromo)
            
            all_routes_list.append({
                'chromosome': chromo,
                'distance': dist,
                'cities': cities_sequence,
                'city_key': city_key,
                'route_key': route_key
            })
        
        # Sort by distance first
        all_routes_list.sort(key=lambda x: x['distance'])
        
        # ═══════════════════════════════════════════════════════════════════════════════
        # LEVEL 1: Remove exact duplicates (same city sequence)
        # ═══════════════════════════════════════════════════════════════════════════════
        unique_by_sequence = {}
        for route in all_routes_list:
            key = route['city_key']
            if key not in unique_by_sequence:
                unique_by_sequence[key] = route
            # Keep the one with better distance if duplicates exist
            elif route['distance'] < unique_by_sequence[key]['distance']:
                unique_by_sequence[key] = route
        
        # Convert back to list
        unique_routes = list(unique_by_sequence.values())
        unique_routes.sort(key=lambda x: x['distance'])
        
        # ═══════════════════════════════════════════════════════════════════════════════
        # LEVEL 2: Remove near-duplicates (distance difference < 1km)
        # ═══════════════════════════════════════════════════════════════════════════════
        DISTANCE_THRESHOLD = 1.0  # km
        
        final_unique = []
        for route in unique_routes:
            is_duplicate = False
            for existing in final_unique:
                # Check if distance is very similar
                if abs(route['distance'] - existing['distance']) < DISTANCE_THRESHOLD:
                    # Also check if city sets are similar (more than 80% same cities)
                    route_cities = set(route['cities'][1:-1])  # Exclude source/dest
                    existing_cities = set(existing['cities'][1:-1])
                    if len(route_cities & existing_cities) >= 0.8 * max(len(route_cities), len(existing_cities)):
                        is_duplicate = True
                        break
            
            if not is_duplicate:
                final_unique.append(route)
        
        # ═══════════════════════════════════════════════════════════════════════════════
        # LEVEL 3: Generate additional variations if needed (ensuring uniqueness)
        # ═══════════════════════════════════════════════════════════════════════════════
        existing_keys = {r['city_key'] for r in final_unique}
        
        def generate_unique_variation(base_chromo, attempt=0):
            """Generate a variation that's guaranteed to be unique"""
            if attempt > 20:  # Prevent infinite attempts
                return None
            
            variation = base_chromo.copy()
            
            # Strategy 1: Remove a random intermediate city
            if len(variation) > 2 and random.random() < 0.5:
                variation.pop(random.randint(0, len(variation) - 1))
            
            # Strategy 2: Replace a city with a new one from candidates
            elif len(selected_candidates) > len(variation):
                idx_to_replace = random.randint(0, len(variation) - 1)
                available = [i for i in range(len(selected_candidates)) if i not in variation]
                if available:
                    variation[idx_to_replace] = random.choice(available)
            
            # Strategy 3: Swap two cities
            elif len(variation) >= 2:
                i, j = random.sample(range(len(variation)), 2)
                variation[i], variation[j] = variation[j], variation[i]
            
            # Check if this variation is unique
            new_cities = [source_city] + [selected_candidates[idx]['city'] for idx in variation] + [dest_city]
            new_key = '-'.join(new_cities)
            
            if new_key in existing_keys:
                # Try again with different modification
                return generate_unique_variation(base_chromo, attempt + 1)
            
            return {
                'chromosome': variation,
                'distance': calculate_route_distance(variation),
                'cities': new_cities,
                'city_key': new_key,
                'route_key': tuple(variation)
            }
        
        # Add variations until we have at least 5 unique routes
        while len(final_unique) < 5:
            if not final_unique:
                break
            
            # Try generating from best route
            base = final_unique[0]['chromosome']
            new_route = generate_unique_variation(base)
            
            if new_route and new_route['city_key'] not in existing_keys:
                final_unique.append(new_route)
                existing_keys.add(new_route['city_key'])
            else:
                # Try from other existing routes
                found_new = False
                for existing in final_unique[:3]:  # Try top 3
                    new_route = generate_unique_variation(existing['chromosome'])
                    if new_route and new_route['city_key'] not in existing_keys:
                        final_unique.append(new_route)
                        existing_keys.add(new_route['city_key'])
                        found_new = True
                        break
                
                if not found_new:
                    break  # Can't find more unique routes
        
        # Final sort and selection
        final_unique.sort(key=lambda x: x['distance'])
        top_routes = final_unique[:5]  # Take exactly 5 or fewer if not enough unique
        
        # Format response
        def format_route(route_data, rank):
            chromo = route_data['chromosome']
            path_coords = [[source_lat, source_lng]]
            path_cities = [{'name': source_city, 'lat': source_lat, 'lng': source_lng}]
            
            for idx in chromo:
                city = selected_candidates[idx]
                path_coords.append([city['lat'], city['lng']])
                path_cities.append({'name': city['city'], 'lat': city['lat'], 'lng': city['lng']})
            
            path_coords.append([dest_lat, dest_lng])
            path_cities.append({'name': dest_city, 'lat': dest_lat, 'lng': dest_lng})
            
            return {
                'rank': rank,
                'path': path_cities,
                'coordinates': path_coords,
                'distance': round(float(route_data['distance']), 2),
                'city_count': len(path_cities)
            }
        
        formatted_routes = [format_route(r, i+1) for i, r in enumerate(top_routes)]
        
        # ═══════════════════════════════════════════════════════════════════════════════
        # STEP 7: DEBUG RESPONSE with validation data + GENERATION HISTORY
        # ═══════════════════════════════════════════════════════════════════════════════
        
        best_distance = formatted_routes[0]['distance'] if formatted_routes else 0
        
        # Calculate evolution statistics
        initial_best = generation_history[0]['best'] if generation_history else 0
        final_best = generation_history[-1]['best'] if generation_history else 0
        improvement_pct = ((initial_best - final_best) / initial_best * 100) if initial_best > 0 else 0
        
        print(f"\n{'='*60}")
        print(f"RESULTS: {len(formatted_routes)} routes generated")
        print(f"Best Distance: {best_distance:.2f} km")
        print(f"Direct Distance: {direct_distance:.2f} km")
        print(f"Ratio: {best_distance/direct_distance:.2f}x" if direct_distance > 0 else "N/A")
        print(f"Generations: {len(generation_history)}")
        print(f"Improvement: {initial_best:.1f} → {final_best:.1f} km ({improvement_pct:.1f}%)")
        print(f"{'='*60}\n")
        
        response = {
            'source': {'name': source_city, 'lat': source_lat, 'lng': source_lng},
            'destination': {'name': dest_city, 'lat': dest_lat, 'lng': dest_lng},
            'routes': formatted_routes,
            'best_route_index': 0,
            'total_routes': len(formatted_routes),
            'computation_time_ms': 0,
            'bounding_box': {
                'min_lat': min_lat, 'max_lat': max_lat,
                'min_lng': min_lng, 'max_lng': max_lng,
                'candidates_found': len(candidate_cities)
            },
            # Generation evolution tracking
            'generation_history': generation_history,
            'evolution_stats': {
                'total_generations': generations,
                'initial_best': round(initial_best, 2),
                'final_best': round(final_best, 2),
                'improvement_percent': round(improvement_pct, 1),
                'data_points': len(generation_history)
            },
            # Debug information
            'debug': {
                'source_coords': [source_lat, source_lng],
                'dest_coords': [dest_lat, dest_lng],
                'direct_distance_km': round(direct_distance, 2),
                'best_route_distance_km': round(best_distance, 2),
                'distance_ratio': round(best_distance / direct_distance, 2) if direct_distance > 0 else None,
                'max_acceptable_km': round(MAX_ACCEPTABLE_DISTANCE, 2),
                'intermediate_cities_max': num_intermediate,
                'bounding_box_buffer_degrees': BUFFER_DEGREES
            }
        }
        
        return jsonify(to_native(response))
        
    except Exception as e:
        import traceback
        print(f"Error in optimize_route: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    load_dataset()
    return jsonify({
        'status': 'healthy',
        'cities_loaded': len(CITIES_LIST)
    })


if __name__ == '__main__':
    # Pre-load dataset
    load_dataset()
    print(f"Loaded {len(CITIES_DF)} cities from dataset")
    app.run(debug=True, host='0.0.0.0', port=5000)
