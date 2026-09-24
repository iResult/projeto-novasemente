<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaturdayProgram extends Model
{
    protected $fillable = [
        'church_id',
        'saturday_date',
        'title',
        'pdf_path',
        'schedule',
        'parse_status',
        'parsed_at',
        'parse_error',
        'live_current_index',
        'live_updated_at',
        'published_at',
        'is_active',
    ];

    protected $casts = [
        'saturday_date' => 'date',
        'published_at' => 'datetime',
        'parsed_at' => 'datetime',
        'live_updated_at' => 'datetime',
        'live_current_index' => 'integer',
        'is_active' => 'boolean',
        'schedule' => 'array',
    ];

    public const PARSE_PENDING = 'pending';

    public const PARSE_OK = 'ok';

    public const PARSE_FAILED = 'failed';

    public function church(): BelongsTo
    {
        return $this->belongsTo(Church::class);
    }
}
