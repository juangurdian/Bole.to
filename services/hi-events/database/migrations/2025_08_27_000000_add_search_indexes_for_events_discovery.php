<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            // Add indexes for better search performance on the public discovery endpoint
            $table->index(['status', 'start_date'], 'events_status_start_date_index');
            $table->index(['category'], 'events_category_index');
            $table->index(['created_at'], 'events_created_at_index');
            
            // Full-text search index for title and description (PostgreSQL)
            // This will need to be adjusted based on the actual database type
            if (config('database.default') === 'pgsql') {
                DB::statement('CREATE INDEX CONCURRENTLY IF NOT EXISTS events_title_description_fulltext_index ON events USING gin((title || \' \' || description) gin_trgm_ops)');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropIndex('events_status_start_date_index');
            $table->dropIndex('events_category_index');
            $table->dropIndex('events_created_at_index');
            
            if (config('database.default') === 'pgsql') {
                DB::statement('DROP INDEX CONCURRENTLY IF EXISTS events_title_description_fulltext_index');
            }
        });
    }
};